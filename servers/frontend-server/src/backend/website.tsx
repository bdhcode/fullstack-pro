import * as React from 'react';
import * as ReactDOMServer from 'react-dom/server';
import { ApolloProvider } from '@apollo/client';
import { getDataFromTree } from '@apollo/client/react/ssr';
import { Html } from './ssr/html';
import Helmet from 'react-helmet';
import path from 'path';
import fs from 'fs';
import { renderToMarkup, renderToSheetList } from 'fela-dom';
import { Provider as ReduxProvider } from 'react-redux';
import { StaticRouter } from 'react-router';
import { logger } from '@cdm-logger/server';
import { ChunkExtractor } from '@loadable/server';
import { createMemoryHistory } from 'history';

import { createClientContainer } from '../config/client.service';
import * as ReactFela from 'react-fela';
import createRenderer from '../config/fela-renderer';
import { createReduxStore } from '../config/redux-config';
import publicEnv from '../config/public-config';
import clientModules, { MainRoute } from '../modules';

let assetMap;
async function renderServerSide(req, res) {
    try {

        const { apolloClient: client } = createClientContainer();

        let context: { pageNotFound?: boolean, url?: string } = { pageNotFound: false };
        const history = createMemoryHistory({ initialEntries: [req.url] });
        const { store } = createReduxStore(history);
        const renderer = createRenderer();
        const App = () =>
            clientModules.getWrappedRoot(
                // tslint:disable-next-line:jsx-wrap-multiline
                <ReduxProvider store={store} >
                    <ApolloProvider client={client}>
                        <ReactFela.Provider renderer={renderer} >
                            <StaticRouter location={req.url} context={context}>
                                <MainRoute />
                            </StaticRouter>
                        </ReactFela.Provider>
                    </ApolloProvider>
                </ReduxProvider>,
                req,
            );

        await getDataFromTree(App);
        if (context.pageNotFound === true) {
            res.status(404);
        } else {
            res.status(200);
        }
        const extractor = new ChunkExtractor({
            statsFile: path.resolve(__FRONTEND_BUILD_DIR__, 'loadable-stats.json'),
            entrypoints: ['index'],
            publicPath: !__DEV__ && __CDN_URL__ ? __CDN_URL__ : '/',
        });
        // Wrap your application using "collectChunks"
        const JSX = extractor.collectChunks(App)
        const content = ReactDOMServer.renderToString(JSX);

        // this comes after Html render otherwise we don't see fela rules generated
        const appStyles = renderToSheetList(renderer);

        // We need to tell Helmet to compute the right meta tags, title, and such.
        const helmet = Helmet.renderStatic(); // Avoid memory leak while tracking mounted instances
        if (context.url) {
            res.writeHead(301, { Location: context.url });
            res.end();
        } else {
            if (__DEV__ || !assetMap) {
                assetMap = JSON.parse(fs.readFileSync(path.join(__FRONTEND_BUILD_DIR__, 'assets.json')).toString());
            }
            const apolloState = Object.assign({}, client.extract());
            const reduxState = Object.assign({}, store.getState());
            const env = {
                ...publicEnv,
            };
            const page = (
                <Html
                    content={content}
                    headElements={[...extractor.getScriptElements(), ...extractor.getLinkElements(), ...extractor.getStyleElements()]}
                    state={apolloState}
                    assetMap={assetMap}
                    helmet={helmet}
                    styleSheet={appStyles}
                    env={env}
                    reduxState={reduxState}
                />
            );
            res.send(`<!doctype html>\n${ReactDOMServer.renderToStaticMarkup(page)}`);
            res.end();
        }
    } catch (err) {
        logger.error('SERVER SIDE RENDER failed due to (%j) ', err.message);
        logger.debug(err);
    }
}
export const websiteMiddleware = async (req, res, next) => {
    try {
        if (req.path.indexOf('.') < 0 && __SSR__) {
            return await renderServerSide(req, res);
        } else if (req.path.indexOf('.') < 0 && !__SSR__ && req.method === 'GET' && !__DEV__) {
            logger.debug('FRONEND_BUILD_DIR with index.html')
            res.sendFile(path.resolve(__FRONTEND_BUILD_DIR__, 'index.html'));
        } else {
            next();
        }
    } catch (e) {
        logger.error('RENDERING ERROR:', e);
        return next(e);
    }
};
