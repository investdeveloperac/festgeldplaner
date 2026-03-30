import json
import os
import random

# Spintax Content Blocks
intros = [
    "<p>In {{CITY}} suchen Anleger vermehrt nach stabilen Renditechancen. Festgeld bietet hier eine optimale Kombination aus Sicherheit und planbarem Zinsertrag. Bei Frominvest AG helfen wir Ihnen, die lukrativsten Angebote für den Standort {{CITY}} zu identifizieren.</p>",
    "<p>Die Finanzwelt in {{CITY}} ist ständig in Bewegung. Wer sein Erspartes im Jahr 2026 sicher anlegen möchte, kommt am Thema Festgeld nicht vorbei. Wir vergleichen für Sie die tagesaktuellen Spitzenreiter unter den Banken in {{CITY}}.</p>",
    "<p>Sicherheit und Rendite sind für Anleger in {{CITY}} oberstes Gebot. Mit einem Festgeldkonto sichern Sie sich attraktive Zinsen bei maximalem Kapitalschutz. Entdecken Sie jetzt die besten Konditionen für Ihren Anlagehorizont in {{CITY}}.</p>"
]

sections = [
    "<h2>Vorteile von Festgeld in {{CITY}}</h2><p>Der grösste Vorteil für Anleger aus {{CITY}} ist die garantierte Verzinsung über die gesamte Laufzeit. Unabhängig von Marktschwankungen wissen Sie genau, welchen Ertrag Sie am Ende erhalten. Zudem greift die gesetzliche Einlagensicherung bis zu 100.000 {{CURRENCY}}.</p>",
    "<h2>Warum sich Festgeld in {{CITY}} lohnt</h2><p>Festgeld ist der Anker in jedem Portfolio. Gerade für konservative Investoren in {{CITY}} bietet es eine risikofreie Alternative zu volatilen Aktienmärkten. Sie profitieren von fest vereinbarten Konditionen und einer kostenfreien Kontoführung bei fast allen Instituten.</p>",
    "<h2>Sicher anlegen am Standort {{CITY}}</h2><p>Wer in {{CITY}} Kapital parken möchte, findet im Festgeld eine bewährte Lösung. Die Transparenz und Planbarkeit dieser Anlageform sind unschlagbar. Wir präsentieren Ihnen exklusiv die besten Optionen, die aktuell für den Schweizer und EU-Raum verfügbar sind.</p>"
]

def generate():
    # Load Data
    with open('pseo/data_pseo.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Load Template
    with open('pseo/template.html', 'r', encoding='utf-8') as f:
        template = f.read()
    
    cities = data['cities']
    
    for i, city in enumerate(cities):
        # Select random-ish content to avoid duplicates
        intro = intros[i % len(intros)].replace('{{CITY}}', city['name'])
        section = sections[i % len(sections)].replace('{{CITY}}', city['name'])
        
        # Currency handling
        currency = "CHF" if city['country'] == "Schweiz" else "EUR"
        section = section.replace('{{CURRENCY}}', currency)
        
        content = intro + "\n" + section
        
        # Fill Template
        page_html = template.replace('{{CITY}}', city['name'])
        page_html = page_html.replace('{{COUNTRY}}', city['country'])
        page_html = page_html.replace('{{SLUG}}', city['slug'])
        page_html = page_html.replace('{{MAX_RATE}}', city['max_rate'])
        page_html = page_html.replace('{{SPINTAX_CONTENT}}', content)
        
        # Save File
        output_path = os.path.join('locations', f"{city['slug']}.html")
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(page_html)
            
    print(f"Successfully generated {len(cities)} pages in /locations/")

if __name__ == "__main__":
    generate()
