const fs = require("fs");
const https = require("https");
const httpProxy = require("http-proxy");
const jwt_decode = require("jwt-decode");

const PORT = parseInt(process.env.PORT) || 5050;
const KEY_PEM = process.env.KEY_PEM || "./certs/key.pem";
const CERT_PEM = process.env.CERT_PEM || "./certs/cert.pem";
const PROXY_TARGET = process.env.PROXY_TARGET || "https://localhost:5051";

const tokenArray = [];

console.log(`PEM Certificate: ${CERT_PEM}`);
console.log(`Proxy target: ${PROXY_TARGET}`);

function storeToken(key, value) {
  tokenArray[key] = value;
  console.log(`Token ${key} is cached!`);
}

function getCachedToken(key) {
  return tokenArray[key];
}

function hasClientCredentialsGrantType(body) {
  let bodyObj;
  try {
    bodyObj = JSON.parse(body);
  } catch (e) {}
  return (
    bodyObj &&
    bodyObj["grant_type"] &&
    bodyObj["grant_type"] === "client_credentials"
  );
}

function hasExpiredCacheToken(key) {
  const jwt = tokenArray[key];
  if (jwt) {
    const jwt_dec = jwt_decode(jwt);
    const now = Math.round(new Date() / 1000);
    if (now > jwt_dec.exp)
      console.log(
        `Token ${key} is expired! exp=${jwt_dec.exp} now=${now} diff=${
          jwt_dec.exp - now
        }`
      );
    return now > jwt_dec.exp;
  }
  return true;
}

function getKey(body) {
  let bodyObj;
  try {
    bodyObj = JSON.parse(body);
  } catch (e) {}
  return "".concat(
    bodyObj["client_id"],
    "-",
    bodyObj["audience"],
    "-",
    bodyObj["grant_type"]
  );
}

const proxy = httpProxy.createProxyServer({
  ssl: {
    key: fs.readFileSync(KEY_PEM, "utf8"),
    cert: fs.readFileSync(CERT_PEM, "utf8"),
  },
  secure: false, // Depends on your needs, could be false.
});

const server = https
  .createServer(
    {
      key: fs.readFileSync(KEY_PEM, "utf8"),
      cert: fs.readFileSync(CERT_PEM, "utf8"),
    },
    function (req, res) {
      let body = [];
      req
        .on("error", (err) => {
          console.error(err);
        })
        .on("data", (chunk) => {
          body.push(chunk);
        })
        .on("end", () => {
          body = Buffer.concat(body).toString();
          // Proxing calls
          if (
            hasClientCredentialsGrantType(body) &&
            hasExpiredCacheToken(getKey(body))
          ) {
            proxy.web(req, res, {
              target: PROXY_TARGET,
            });
            proxy.on("proxyRes", function (proxyRes) {
              let pbody = [];
              proxyRes
                .on("error", (err) => {
                  console.error(err);
                })
                .on("data", (chunk) => {
                  pbody.push(chunk);
                })
                .on("end", () => {
                  pbody = Buffer.concat(pbody).toString();
                  storeToken(getKey(body), pbody);
                });
            });
          } else {
            res.writeHead(200, { "content-type": "application/json" });
            res.write(getCachedToken(getKey(body)));
            res.end();
          }
        });
    }
  )
  .listen(PORT, function (err) {
    console.log(`Proxy server listening on port ${PORT}`);
  });
