// app.config.js
const { execSync } = require('child_process');

let commitHash = 'Dev';

try {
  // Executa o comando git para pegar o hash curto (ex: a1b2c3d)
  commitHash = execSync('git rev-parse --short HEAD').toString().trim();
} catch (e) {
  console.log('Não foi possível ler o hash do git. Usando valor padrão.');
}

module.exports = ({ config }) => {
  return {
    ...config, // Mantém todas as configs do seu app.json
    extra: {
      ...config.extra, // Mantém outras configs extras se existirem
      commitHash: commitHash, // Injeta o Hash aqui
    },
  };
};