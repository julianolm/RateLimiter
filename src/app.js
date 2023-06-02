const express = require("express");
const getRedis = require("./db/redis").getRedis;
const startRedis = require("./db/redis").startRedis;

// https://www.youtube.com/watch?v=CpPaadKZ47s&ab_channel=DevPleno

// Implementado o rate Limit.
// Ele aceita 5 requests em uma janela de 2 minutos. Mais que isso ele bloqueia por 2min
// Estava a funcionar, mas agora esta com um erro depois que movi a logica do rate limit para um middleware. Consertar.

// Ideia: armazenar quantidade de blocks. A cada novo bloc (5 requests falhos) o block
//        seguinte dura o dobro do tempo. Armazena quantidade de blocks a cada 24h

// Questionamento
// Entendo que isso proteja contra brute force, mas contra DOS nao vejo sentido. Afinal
// a aplicação continua recebendo os requests e tendo de responde-los. Tudo bem se falar que
// é um request computacionalmente barato para se responder. Para essa finalidade deveria
// estar em um web server ou load balancer (como na cloudflare).

const app = express();

const port = 3000;

// console.log(module); //logs usefull information about the module

async function rateLimitMiddleware(req, res) {
  const redis = await getRedis();
  const ip = req.ip.replaceAll(":", ".");
  const redisKey = `RATE_LIMIT:${ip}`;

  const ipAccessCount = Number(await redis.get(redisKey)) || 0;

  if (ipAccessCount >= 5) {
    const ttl = await redis.ttl(redisKey);
    console.log(ttl);
    throw new Error(`Too many requests. Try again in ${ttl} seconds`);
    // res.send(`Too many requests. Try again in ${ttl} seconds`);
    // Esta dando erro.
    // Qual a forma boa de retornar um erro no request no express?
    // Lembrando que esse erro tem que conter a informacao do tempo de tente
    // novamente para o client tentar de novo.
  }
  console.log(`User with IP ${ip} requested home.`);

  await redis.set(redisKey, ipAccessCount + 1, { EX: 120 });
}

app.get("/", async (req, res) => {
  rateLimitMiddleware(req, res);
  res.send(`<h1>Hello, World!</h1>`);
});

app.listen(port, async () => {
  await startRedis();
  console.log(`Example app listening on port ${port}`);
});
