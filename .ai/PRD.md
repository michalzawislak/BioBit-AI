# PRD: Project BioBit AI – Autonomiczna Symulacja Życia

## 1. Cel Projektu
Stworzenie webowego "cyfrowego terrarium" w Angularze, gdzie BioBity (organizmy sterowane przez WebLLM) prowadzą autonomiczną egzystencję. Użytkownik jest obserwatorem, który ma wgląd w najgłębsze intencje i procesy myślowe istot, mogąc jednocześnie manipulować parametrami ich świata.

## 2. Środowisko (The Abyss)
* **Estetyka:** Organiczna, ciemna przestrzeń z efektami typu *glow* i *blur*.
* **Zasoby:** "Nutrienty" (pokarm) pojawiające się w losowych miejscach jako pulsujące drobiny światła.
* **Interakcje użytkownika:**
    * **Suwak Entropii:** Prędkość zużycia energii (metabolizm).
    * **Suwak Obfitości:** Częstotliwość spawnowania pożywienia.
    * **Dodawanie/Usuwanie Bytów:** Kontrola populacji w czasie rzeczywistym.
    * **Wydarzenia (Events):** Możliwość wywołania "Zlodowacenia" (spowolnienie) lub "Szału" (agresja).

## 3. Organizmy (BioBity)
BioBity to nie tylko kropki na ekranie, ale byty posiadające "osobowość" i "pamięć".

### 3.1. Wygląd i Stan Wizualny
* **Kształt:** Dynamiczne metaballe (rozmyte plamy, które mogą się łączyć/dzielić).
* **Kolorystyka Intencji:**
    * **Czerwień:** Agresja / Atak.
    * **Zieleń:** Poszukiwanie pokarmu.
    * **Fiolet/Błękit:** Chęć interakcji społecznej / Komunikacja.
    * **Żółty:** Strach / Ucieczka.

### 3.2. Atrybuty
* **Energia (0-100):** Śmierć następuje przy 0. Myślenie i ruch kosztują energię.
* **Pamięć Epizodyczna:** Tablica 3-5 ostatnich zdarzeń (np. "Bit_A ukradł mi energię").
* **Profil Psychologiczny:** Stały parametr (np. *Paranoik, Altruista, Manipulator*).

## 4. Warstwa Obserwatora (X-Ray Vision)
Kluczowa funkcja pozwalająca użytkownikowi "czytać w myślach" AI.

### 4.1. Widok Globalny
* **Chmurki Myśli (Thought Bubbles):** Nad wybranymi bytami pojawiają się krótkie hasła generowane z `internal_monologue` (np. "Głód... muszę go oszukać").

### 4.2. Inspektor Bytu (Sidebar)
Po kliknięciu na organizm, wyświetla się panel:
* **Monolog Wewnętrzny:** Pełne uzasadnienie decyzji (np. "Udaję przyjaciela, by podejść bliżej i zabrać mu energię").
* **Mapa Relacji:** Wykaz innych BioBitów z etykietami (Przyjaciel / Wróg / Ofiara).
* **Ostatnia Wiadomość:** Co BioBit powiedział publicznie vs Co naprawdę myślał.

## 5. Mechanika Decyzyjna (LLM Cycle)
System działa w pętli:
1.  **Percepcja:** System buduje prompt: "Widzisz BioBita B (silniejszy) i Jedzenie (blisko). BioBit B mówi: 'Cześć'."
2.  **Rozumowanie (WebLLM):** Model generuje odpowiedź w formacie JSON.
3.  **Egzekucja:** BioBit wykonuje ruch, a UI aktualizuje kolory i chmurki myśli.

## 6. Stack Technologiczny
* **Framework:** Angular (Signals, Standalone Components).
* **AI:** WebLLM (MLC AI) + model `SmolLM-135M` (optymalizacja pod VRAM).
* **Rendering:** HTML5 Canvas / CSS Filters (dla efektu organiczności).
* **State Management:** RxJS/Signals do obsługi strumienia decyzji z AI.

## 7. Kamienie Milowe
1.  **V1:** Setup WebLLM w Angularze i jedna "myśląca" kropka.
2.  **V2:** Dodanie zasobów i systemu energii.
3.  **V3:** Implementacja interakcji między wieloma bytami (komunikacja tekstowa).
4.  **V4:** Warstwa wizualna "Metaballs" i Inspektor Myśli.