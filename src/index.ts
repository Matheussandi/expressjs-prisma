import { PrismaClient } from "@prisma/client";
import express from "express";

import { convertHourStringToMinutes } from './utils/convertHourStringToMinutes';
import { convertMinutesToHourString } from './utils/convertMinutesToHourString';

const prisma = new PrismaClient();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.raw({ type: "application/vnd.custom-type" }));
app.use(express.text({ type: "text/html" }));

app.get('/games', async (req, res) => {
  const games = await prisma.game.findMany({
      include: {
          _count: {
              select: {
                  ads: true,
              }
          }
      }
  })

  return res.status(200).json(games);
})

app.post('/games/:id/ads', async (req, res) => {
  const gameId: string = req.params.id;
  const body = req.body;

  try {
      const ad = await prisma.ad.create({
          data: {
              gameId,
              name: body.name,
              weekDays: body.weekDays.join(','),
              useVoiceChannel: body.useVoiceChannel,
              yearsPlaying: body.yearsPlaying,
              hourStart: convertHourStringToMinutes(body.hourStart),
              hourEnd: convertHourStringToMinutes(body.hourEnd),
              discord: body.discord,
          }
      });
      return res.status(201).json(ad);
  } catch (error) {
      return res.status(400).json({ error: "Dados inválidos" });
  }
})

app.get('/games/:id/ads', async (req, res) => {
  const gameId = req.params.id;

  try {
      const ads = await prisma.ad.findMany({
          select: {
              id: true,
              name: true,
              weekDays: true,
              useVoiceChannel: true,
              yearsPlaying: true,
              hourStart: true,
              hourEnd: true,
          },
          where: {
              gameId,
          },
          orderBy: {
              createdAt: 'desc',
          }
      });

      return res.status(200).json(ads.map(ad => {
          return {
              ...ad,
              weekDays: ad.weekDays.split(','),
              hourStart: convertMinutesToHourString(ad.hourStart),
              hourEnd: convertMinutesToHourString(ad.hourEnd),
          }
      }));
  } catch (error) {
      return res.status(400).json({ error: "Jogo inválido" });
  }
})

app.get('/ads/:id/discord', async (req, res) => {
  const adId = req.params.id;

  try {
      const ad = await prisma.ad.findUniqueOrThrow({
          select: {
              discord: true,
          },
          where: {
              id: adId,
          }

      })

      return res.status(200).json(ad);
  } catch (error) {
      return res.status(400).json({ error: "Anúncio inválido" });
  }

})

app.get("/", async (req, res) => {
  res.send(
    `
  <h1>Todo REST API</h1>
  <h2>Available Routes</h2>
  <pre>
    GET, POST /todos
    GET, PUT, DELETE /todos/:id
  </pre>
  `.trim(),
  );
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
