const fs = require("fs");
const https = require("https");

const KEY_PEM = process.env.KEY_PEM || "./certs/key.pem";
const CERT_PEM = process.env.CERT_PEM || "./certs/cert.pem";

var server = https
  .createServer(
    {
      key: fs.readFileSync(KEY_PEM, "utf8"),
      cert: fs.readFileSync(CERT_PEM, "utf8"),
    },
    function (req, res) {
      console.log("-------------------------------------------");
      const { headers, method, url } = req;
      console.log(method, url);
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
          console.log(body);
        });
      res.writeHead(200, { "content-type": "application/json" });
      res.write(
        JSON.stringify({
          token_type: "Bearer",
          access_token:
            "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2MzM5MDYxNzgsImV4cCI6MTY2Mjg1MDE3OCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoianJvY2tldEBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6IkpvaG5ueSIsIlN1cm5hbWUiOiJSb2NrZXQiLCJFbWFpbCI6Impyb2NrZXRAZXhhbXBsZS5jb20iLCJSb2xlIjpbIk1hbmFnZXIiLCJQcm9qZWN0IEFkbWluaXN0cmF0b3IiXX0.vjBd8Qhlmj1WhpQL7EKaYnoiS1QDwj1yCLAesq5IEY4",
        })
      );
      res.end();
    }
  )
  .listen(5051, function (err) {
    console.log("Fake server listening on Port 5051");
  });
