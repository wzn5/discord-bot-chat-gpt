require("dotenv/config");
console.clear();
const { Client, IntentsBitField, AttachmentBuilder } = require("discord.js");
const { Configuration, OpenAIApi } = require("openai");

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
  ],
});

client.on("ready", () => {
  const atividade = [
    {
      name: `${client.guilds.cache.size.toLocaleString()} Guilds`,
      type: 2,
    },
    {
      name: `${client.guilds.cache
        .map((g) => g.memberCount)
        .reduce((x, f) => x + f, 0)
        .toLocaleString()} Users`,
      type: 2,
    },
  ];
  const status = [`online`, `online`];

  let random1 = 0;

  setInterval(() => {
    if (random1 >= atividade.length) random1 = 0;

    client.user.setActivity(atividade[random1]);

    random1++;
  }, 10000);
  let random2 = 0;

  setInterval(() => {
    if (random2 >= atividade.length) random2 = 0;

    client.user.setStatus(status[random2]);

    random2++;
  }, 25000);
  console.log(`The bot is online on ${client.user.tag}`);
});

const configuration = new Configuration({
  apiKey: process.env.API_KEY,
});
const openai = new OpenAIApi(configuration);

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (message.channel.id !== process.env.CHANNEL_ID) return;
  if (message.content.startsWith("!")) return;

  let conversationLog = [
    { role: "system", content: "You are a friendly chatbot." },
  ];

  try {
    await message.channel.sendTyping();

    let prevMessages = await message.channel.messages.fetch({ limit: 15 });
    prevMessages.reverse();

    prevMessages.forEach((msg) => {
      if (message.content.startsWith("!")) return;
      if (msg.author.id !== client.user.id && message.author.bot) return;
      if (msg.author.id !== message.author.id) return;

      conversationLog.push({
        role: "user",
        content: msg.content,
      });
    });

    const result = await openai
      .createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: conversationLog,
        max_tokens: 2048, // limit token usage
        temperature: 0.7,
        top_p: 1,
        frequency_penalty: 0.0,
        presence_penalty: 0.0,
      })
      .catch((error) => {
        console.log(`OPENAI ERR: ${error}`);
      });
    let responseMessage = result.data.choices[0].message;
    //utf-8
    if (responseMessage.length >= 2000) {
      const attachment = new AttachmentBuilder(
        Buffer.from(responseMessage, "utf-8"),
        { name: "response.txt" }
      );
      await message.reply({ files: [attachment] });
    } else {
      await message.reply(result.data.choices[0].message);
    }
  } catch (error) {
    console.log(`ERR: ${error}`);
  }
});

client.login(process.env.TOKEN);
