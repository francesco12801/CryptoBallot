# Usa un'immagine di Node.js come base
FROM node:14

# Imposta la directory di lavoro
WORKDIR /usr/src/app

# Copia i file di configurazione del package manager
COPY package*.json ./

# Installa le dipendenze
RUN npm install

# Copia tutto il resto del progetto
COPY . .

# Espone la porta del servizio
EXPOSE 4002

# Comando per avviare l'applicazione
CMD ["node", "index.js"]
