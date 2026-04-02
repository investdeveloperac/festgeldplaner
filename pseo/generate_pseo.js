const fs = require('fs');
const path = require('path');

// Content Variations
const intros = [
    "<p>In {{CITY}} suchen Anleger vermehrt nach stabilen Renditechancen. Festgeld bietet hier eine optimale Kombination aus Sicherheit und planbarem Zinsertrag. Bei FestgeldPlaner helfen wir Ihnen, die lukrativsten Angebote für den Standort {{CITY}} zu identifizieren.</p>",
    "<p>Die Finanzwelt in {{CITY}} ist ständig in Bewegung. Wer sein Erspartes im Jahr 2026 sicher anlegen möchte, kommt am Thema Festgeld nicht vorbei. Wir vergleichen für Sie die tagesaktuellen Spitzenreiter unter den Banken in {{CITY}}.</p>",
    "<p>Sicherheit und Rendite sind für Anleger in {{CITY}} oberstes Gebot. Mit einem Festgeldkonto sichern Sie sich attraktive Zinsen bei maximalem Kapitalschutz. Entdecken Sie jetzt die besten Konditionen für Ihren Anlagehorizont in {{CITY}}.</p>"
];

const sections = [
    "<h2>Vorteile von Festgeld in {{CITY}}</h2><p>Der grösste Vorteil für Anleger aus {{CITY}} ist die garantierte Verzinsung über die gesamte Laufzeit. Unabhängig von Marktschwankungen wissen Sie genau, welchen Ertrag Sie am Ende erhalten. Zudem greift die gesetzliche Einlagensicherung bis zu 100.000 {{CURRENCY}}.</p>",
    "<h2>Warum sich Festgeld in {{CITY}} lohnt</h2><p>Festgeld ist der Anker in jedem Portfolio. Gerade für konservative Investoren in {{CITY}} bietet es eine risikofreie Alternative zu volatilen Aktienmärkten. Sie profitieren von fest vereinbarten Konditionen und einer kostenfreien Kontoführung bei fast allen Instituten.</p>",
    "<h2>Sicher anlegen am Standort {{CITY}}</h2><p>Wer in {{CITY}} Kapital parken möchte, findet im Festgeld eine bewährte Lösung. Die Transparenz und Planbarkeit dieser Anlageform sind unschlagbar. Wir präsentieren Ihnen exklusiv die besten Optionen, die aktuell für den Schweizer und EU-Raum verfügbar sind.</p>"
];

function generate() {
    const data = JSON.parse(fs.readFileSync('pseo/data_pseo.json', 'utf8'));
    const template = fs.readFileSync('pseo/template.html', 'utf8');
    
    if (!fs.existsSync('locations')) fs.mkdirSync('locations');
    
    const cities = data.cities;
    cities.forEach((city, i) => {
        let intro = intros[i % intros.length].replace(/{{CITY}}/g, city.name);
        let section = sections[i % sections.length].replace(/{{CITY}}/g, city.name);
        
        const currency = city.country === "Schweiz" ? "CHF" : "EUR";
        section = section.replace(/{{CURRENCY}}/g, currency);
        
        const content = intro + "\n" + section;
        
        const securityLabel = city.country === "Schweiz" ? "esisuisse geschützt" : "EU-Einlagensicherung";
        
        let pageHtml = template
            .replace(/{{CITY}}/g, city.name)
            .replace(/{{COUNTRY}}/g, city.country)
            .replace(/{{SLUG}}/g, city.slug)
            .replace(/{{MAX_RATE}}/g, city.max_rate)
            .replace(/{{SECURITY_LABEL}}/g, securityLabel)
            .replace(/{{SPINTAX_CONTENT}}/g, content);
            
        const outputPath = path.join('locations', `${city.slug}.html`);
        fs.writeFileSync(outputPath, pageHtml);
    });
    
    console.log(`Successfully generated ${cities.length} pages in /locations/`);
}

generate();


