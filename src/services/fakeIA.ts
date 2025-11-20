export const gerarBioLocalmente = (nome: string, skills: string[]) => {
  const listaSkills = skills.length > 0 ? skills.join(', ') : 'diversas áreas';
  
  const templates = [
    `Olá! Sou ${nome}, apaixonado por troca de conhecimentos. Atualmente foco em ${listaSkills}. Vamos trocar experiências no SkillSwap Hub?`,
    `Profissional dedicado: ${nome}. Minhas principais competências são ${listaSkills}. Busco aprender e ensinar na plataforma de forma colaborativa.`,
    `${nome} | Especialista em ${skills[0] || 'tecnologia'}. Aberto a novas conexões e mentorias.`,
    `Aqui é ${nome}! Estou aqui para compartilhar meu conhecimento em ${listaSkills} e aprender com a comunidade.`
  ];
  
  const randomIndex = Math.floor(Math.random() * templates.length);
  return templates[randomIndex];
};