import fs from 'fs';
import path from 'path';

const filesToEmbed = [
    'tabela_de_precos_gcac.html',
    'tabela_de_precos_gcac_cac_individual.html',
    'tabela_de_precos_gcac_357_mag.html',
    'tabela_de_precos_gcac_308win.html'
];

const logoPath = 'public/Logo oficial.png';

if (!fs.existsSync(logoPath)) {
    console.error(`Erro: o arquivo ${logoPath} não foi encontrado.`);
    process.exit(1);
}

const logoBase64 = fs.readFileSync(logoPath).toString('base64');
const logoDataUri = `data:image/png;base64,${logoBase64}`;

filesToEmbed.forEach(htmlPath => {
    if (!fs.existsSync(htmlPath)) {
        console.warn(`Aviso: O arquivo ${htmlPath} não foi encontrado, pulando...`);
        return;
    }

    let htmlContent = fs.readFileSync(htmlPath, 'utf8');

    // We replace the entire <img> tag with a version that has the embedded logo at full size
    const targetPattern = /<img id="brand-logo"[\s\S]*?\/>/;
    const replacement = `<img id="brand-logo" src="${logoDataUri}" alt="Portal G CAC" class="h-24 md:h-28 object-contain mx-auto" />`;

    if (targetPattern.test(htmlContent)) {
        htmlContent = htmlContent.replace(targetPattern, replacement);
        fs.writeFileSync(htmlPath, htmlContent);
        console.log(`Sucesso: Logo oficial ampliada embutida como Base64 no arquivo ${htmlPath}!`);
    } else {
        console.error(`Erro: Não foi possível localizar a tag <img id="brand-logo" ... /> no arquivo ${htmlPath}.`);
    }
});
