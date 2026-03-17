const { Client, LocalAuth } = require('whatsapp-web.js');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        executablePath: '/usr/bin/google-chrome',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', (qr) => {
    console.log('QR RECEIVED', qr);
});

client.on('ready', () => {
    console.log('✅ Bot online!');
});

client.initialize();

// --- CONFIGURAÇÕES ---
const MEU_NUMERO = '5511939595166@c.us';
const NOME_BOT = 'Nephor';

client.on('message', async msg => {
    const chat = await msg.getChat();
    const user_id = msg.author || msg.from;
    const corpo = msg.body;
    const éDono = user_id.includes(MEU_NUMERO.replace('@c.us', ''));
    
    // Admins
    let éAdm = false;
    if (chat.isGroup) {
        const participando = chat.participants;
        const admStatus = participando.find(p => p.id._serialized === user_id);
        éAdm = admStatus ? (admStatus.isAdmin || admStatus.isSuperAdmin) : false;
    }

    // Inicializar Usuário
    if (!db.usuarios[user_id]) {
        db.usuarios[user_id] = { carteira: 100, banco: 0, emprego: 'Desempregado', punido: false, fimPunicao: 0, pets: [] };
        salvarBanco(db);
    }
    const user = db.usuarios[user_id];

    // Anti-Punição (Mute)
    if (user.punido && Date.now() < user.fimPunicao) {
        await msg.delete(true);
        return;
    }

    if (corpo.startsWith(PREFIXO)) {
        const args = corpo.slice(1).trim().split(/ +/);
        const comando = args.shift().toLowerCase();
        const mencao = msg.mentionedIds[0];

        switch (comando) {
            case 'menu':
                msg.reply(`🏙️ *SISTEMA ${NOME_BOT.toUpperCase()}*\n\n*MEMBROS:*\n!tocar, !stick, !tapa, !beijo, !cafuné, !gostoso, !chances, !rpg\n\n*ECONOMIA:*\n!trabalhar, !carteira, !roubar, !depositar, !pets, !comprarpet\n\n*ADMS:*\n!ban, !kick, !punição, !agp, !fgp, !promover, !rebaixar`);
                break;

            // --- COMANDO DE MÚSICA ---
            case 'tocar':
                const pesquisa = args.join(' ');
                if (!pesquisa) return msg.reply("Qual música você quer ouvir?");
                msg.reply(`🔎 Buscando: *${pesquisa}*...`);
                
                const r = await yts(pesquisa);
                const video = r.videos[0];
                if (!video) return msg.reply("Música não encontrada.");

                msg.reply(`🎶 *Tocando:* ${video.title}\n⏳ Aguarde o envio do áudio...`);
                
                // Nota: O download via ytdl-core pode ser instável no Replit sem proxy, 
                // mas esta é a base funcional.
                const media = await MessageMedia.fromUrl(video.url);
                client.sendMessage(msg.from, media, { sendAudioAsVoice: true });
                break;

            // --- COMANDOS DE INTERAÇÃO ---
            case 'stick':
                if (msg.hasMedia) {
                    const media = await msg.downloadMedia();
                    client.sendMessage(msg.from, media, { sendMediaAsSticker: true });
                }
                break;

            case 'tapa':
                msg.reply("👋 *POW!* Você deu um tapa!");
                break;

            // --- SISTEMA DE PETS ---
            case 'pets':
                msg.reply("🐾 *LOJA DE PETS NEPHOR:*\n\n1. 🐱 Gato - R$ 500\n2. 🐶 Cão - R$ 800\n3. 🐉 Dragão - R$ 5000\n\nUse !comprarpet [nome]");
                break;

            case 'comprarpet':
                const petNome = args[0]?.toLowerCase();
                const precos = { gato: 500, cao: 800, dragao: 5000 };
                if (!precos[petNome]) return msg.reply("Pet não disponível.");
                if (user.carteira < precos[petNome]) return msg.reply("Dinheiro insuficiente!");
                
                user.carteira -= precos[petNome];
                user.pets.push(petNome);
                salvarBanco(db);
                msg.reply(`🎉 Parabéns! Você comprou um ${petNome}!`);
                break;

            // --- COMANDOS ADM ---
            case 'punição':
                if (!éAdm && !éDono) return;
                let alvo = mencao || (msg.hasQuotedMsg ? (await msg.getQuotedMessage()).author : null);
                if (!alvo) return msg.reply("Mencione alguém.");
                
                let tempo = Math.floor(Math.random() * 41) + 20; // 20 a 60 min
                db.usuarios[alvo].punido = true;
                db.usuarios[alvo].fimPunicao = Date.now() + (tempo * 60000);
                salvarBanco(db);
                msg.reply(`🔇 Silenciado por ${tempo} minutos.`);
                break;

            case 'ban':
                if (!éAdm && !éDono) return;
                chat.removeParticipants([mencao || (await msg.getQuotedMessage()).author]);
                break;
        }
    }
});

client.initialize();
