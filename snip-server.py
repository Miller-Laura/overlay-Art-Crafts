#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Snip Server - Liest Snip.txt und stellt es fürs Overlay bereit
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import os
from pathlib import Path

# ===== KONFIGURATION =====
# Passe den Pfad zu deiner Snip.txt an!
SNIP_FILE = Path(r"E:\Snip-v8.0.2\Snip\Snip.txt")
PORT = 8765

class SnipHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        """Liest Snip.txt und gibt Song-Info zurück"""
        
        # CORS Headers (damit Browser darauf zugreifen kann)
        self.send_response(200)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        try:
            # Snip.txt lesen
            if SNIP_FILE.exists():
                with open(SNIP_FILE, 'r', encoding='utf-8') as f:
                    song_text = f.read().strip()
                
                # Parse "Artist - Title" Format
                if ' - ' in song_text:
                    parts = song_text.split(' - ', 1)
                    artist = parts[0].strip()
                    title = parts[1].strip()
                else:
                    artist = "Unbekannt"
                    title = song_text
                
                response = {
                    'artist': artist,
                    'title': title,
                    'raw': song_text,
                    'status': 'ok'
                }
            else:
                response = {
                    'artist': 'Snip.txt nicht gefunden',
                    'title': f'Pfad: {SNIP_FILE}',
                    'raw': '',
                    'status': 'error'
                }
        
        except Exception as e:
            response = {
                'artist': 'Fehler',
                'title': str(e),
                'raw': '',
                'status': 'error'
            }
        
        # Als JSON zurückgeben
        self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))
    
    def log_message(self, format, *args):
        """Logging - zeigt Anfragen in der Console"""
        print(f"[Snip Server] {args[0]}")

def run_server():
    """Startet den Server"""
    server_address = ('localhost', PORT)
    httpd = HTTPServer(server_address, SnipHandler)
    
    print("=" * 60)
    print("🎵 SNIP SERVER LÄUFT!")
    print("=" * 60)
    print(f"📂 Liest: {SNIP_FILE}")
    print(f"🌐 Server: http://localhost:{PORT}")
    print(f"📡 Widget kann jetzt Song-Daten abrufen!")
    print("")
    print("💡 Zum Beenden: STRG + C")
    print("=" * 60)
    print("")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n👋 Server wird beendet...")
        httpd.shutdown()

if __name__ == "__main__":
    # Check ob Snip.txt existiert
    if not SNIP_FILE.exists():
        print("⚠️  WARNUNG:")
        print(f"   Snip.txt nicht gefunden: {SNIP_FILE}")
        print("")
        print("💡 Passe den Pfad in Zeile 12 an!")
        print(f"   Aktuell: {SNIP_FILE}")
        print("")
        input("Drücke Enter um trotzdem zu starten...")
    
    run_server()