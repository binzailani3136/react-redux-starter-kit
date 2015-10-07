import webpack from 'webpack';
import webpackMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';

import express from 'express';
import path from 'path';
import httpProxy from 'http-proxy';
import http from 'http';
import bodyParser from 'body-parser';
import config from './webpack.config';

const isProduction = process.env.NODE_ENV === 'production';
const isDeveloping = !isProduction;

const app = express();

// Webpack dev server
if (isDeveloping) {
  const WEBPACK_PORT = 3001;
  const compiler = webpack(config);

  app.use(webpackMiddleware(compiler, {
    publicPath: config.output.publicPath,
    contentBase: 'src',
    stats: {
      colors: true,
      hash: false,
      timings: true,
      chunks: false,
      chunkModules: false,
      modules: false
    }
  }));

  app.use(webpackHotMiddleware(compiler));
  app.listen(WEBPACK_PORT, 'localhost', function (err, result) {
    if (err) {
      console.log(err);
    }

    console.log('WebpackDevServer listening at localhost:'+WEBPACK_PORT);
  });
}


//  RESTful API
const proxy = httpProxy.createProxyServer({
  changeOrigin: true,
  ws: false
}); 

const port = isProduction ? (process.env.PORT||80) : 3000;
const publicPath = path.resolve(__dirname, '');

app.use(express.static(publicPath));
app.use(bodyParser.json({ type: 'application/json' }))
app.post('/api/login', function(req, res) {
      const credentials = req.body;
      if(credentials.user==='admin' && credentials.password==='password'){
        res.json({'user': credentials.user, 'role': 'ADMIN'});   
      }else{
        res.status('500').send({'message' : 'Invalid user/password'});
      }
  });

  app.post('/api/logout', function(req, res) {
      res.json({'user': 'admin', 'role': 'ADMIN'});   
  });

  app.all('/*', function (req, res) {
    proxy.web(req, res, {
        target: 'http://127.0.0.1:3001'
    });
  });

  proxy.on('error', function(e) {
    console.log('error: '+e)
  });

  // We need to use basic HTTP service to proxy
  // websocket requests from webpack
  const server = http.createServer(app);

  server.listen(port, function () {
    console.log('Server running on port ' + port);
  }); 