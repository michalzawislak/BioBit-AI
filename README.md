# BioBit AI - Autonomiczna Symulacja Życia

BioBit AI to interaktywna symulacja cyfrowego terrarium, w której autonomiczne organizmy (BioBity) prowadzą własną egzystencję sterowaną przez lokalny model AI (WebLLM). Użytkownik pełni rolę obserwatora z możliwością wglądu w procesy myślowe istot oraz manipulacji parametrami ich świata.

![BioBit AI](https://via.placeholder.com/800x400/0f172a/22c55e?text=BioBit+AI+-+Digital+Terrarium)

## 🎯 Główne Założenia

- **Autonomiczne Organizmy** - BioBity podejmują decyzje niezależnie na podstawie swojej osobowości, pamięci i aktualnej sytuacji
- **X-Ray Vision** - Możliwość "czytania w myślach" AI i obserwacji ich wewnętrznych monologów
- **Symulacja Ekosystemu** - Zasoby, energetyka, interakcje społeczne, życie i śmierć
- **Lokalne AI** - Cała inteligencja działa w przeglądarce dzięki WebLLM (brak API zewnętrznych)

## 🏗️ Architektura

### Stack Technologiczny

- **Framework:** Angular 21 (Standalone Components, Signals)
- **AI Engine:** WebLLM (MLC AI) + model SmolLM-135M
- **Styling:** Tailwind CSS 4
- **State Management:** Angular Signals + RxJS

### Struktura Projektu

```
src/app/
├── abyss/                    # Główny komponent wizualizacji
│   └── abyss.component.ts    # Canvas + sterowanie symulacją
├── control-panel/            # Panel sterowania parametrami
│   └── control-panel.component.ts
├── inspector/                # Panel inspekcji wybranego BioBita
│   └── inspector.component.ts
├── legend/                   # Legenda kolorów i oznaczeń
│   └── legend.component.ts
├── social-log/              # Log interakcji społecznych
│   └── social-log.component.ts
├── thought-stream/          # Strumień myśli BioBitów
│   └── thought-stream.component.ts
├── models/                  # Modele danych
│   ├── biobit.model.ts      # Klasa BioBit (organizm)
│   ├── nutrient.model.ts    # System zasobów/pokarmu
│   └── social.model.ts      # Model interakcji społecznych
├── services/                # Serwisy aplikacji
│   ├── simulation.service.ts # Główna logika symulacji
│   └── web-llm.service.ts    # Komunikacja z modelem AI
└── app.component.ts         # Root komponent
```

### Kluczowe Komponenty

#### BioBit (`models/biobit.model.ts`)

Podstawowa jednostka symulacji - autonomiczny organizm:

```typescript
- id: string                          // Unikalny identyfikator
- name: string                        // Nazwa (np. "Bit_1")
- personality: Personality            // Osobowość (paranoid/altruist/manipulator/neutral)
- energy: Signal<number>              // Energia 0-100 (śmierć przy 0)
- intention: Signal<Intention>        // Aktualna intencja
- memories: Signal<Memory[]>          // Pamięć epizodyczna (ostatnie 5 zdarzeń)
- internalMonologue: Signal<string>   // Wewnętrzny monolog (z LLM)
- relations: Signal<Map>              // Relacje z innymi BioBitami
- position: Signal<Position>          // Pozycja na canvasie
```

**Osobowości:**
- **Paranoik** - Nie ufa nikomu, ucieka przed zagrożeniem, atakuje jeśli zaczadzony
- **Altruista** - Pomaga innym, dzieli się energią, buduje przyjaźnie
- **Manipulator** - Mówi przyjaźnie, ale planuje atak (kłamstwa)
- **Neutralny** - Balansuje między agresją a współpracą

**Intencje (kolory):**
- 🟢 **Hunt** (zielony) - Poszukiwanie pokarmu
- 🔴 **Attack** (czerwony) - Atak na inne BioBity
- 🟣 **Socialize** (fioletowy) - Interakcja społeczna
- 🟡 **Flee** (żółty) - Ucieczka przed zagrożeniem
- ⚫ **Dying** (szary) - Śmierć

#### SimulationService (`services/simulation.service.ts`)

Serce aplikacji zarządzające cyklem życia symulacji:

**Główna pętla (60 FPS):**
1. **Update Nutrientów** - Spawnowanie, zużycie, znikanie
2. **Update BioBitów** - Ruch, zużycie energii, interakcje
3. **Cleanup** - Usuwanie starych zwłok i zdarzeń
4. **Thinking Loop** - Co 8 sekund jeden BioBit "myśli" (LLM)

**Cykl Decyzyjny LLM:**
```
Percepcja → Prompt Engineering → WebLLM → JSON Response → Egzekucja → Update UI
```

**Prompt budowany dla LLM zawiera:**
- Tożsamość i osobowość BioBita
- Aktualny poziom energii (krytyczne ostrzeżenia przy <20%)
- Widoczne jedzenie i jego odległość
- Pobliskie BioBity z informacjami o energii i relacjach
- Ostatnie wspomnienia
- Kontekst sytuacyjny

#### Nutrient System (`models/nutrient.model.ts`)

System zasobów w środowisku:

**Typy Nutrientów:**
- 🟢 **Basic** - Standardowy pokarm (+15-25 energii)
- 🔵 **Rich** - Bogaty w energię (+35-50 energii)
- 🔴 **Toxic** - Trujący (zabiera energię)

**Właściwości:**
- Pulsowanie wizualne
- Efekt "glow"
- Automatyczne zużycie po pewnym czasie
- BioBity automatycznie podążają za najbliższym pokarmem

#### WebLLM Service (`services/web-llm.service.ts`)

Integracja z lokalnym modelem AI:

```typescript
- Model: SmolLM-135M (optymalizacja pod VRAM)
- Inicjalizacja w przeglądarce
- Generowanie decyzji w formacie JSON
- Response zawiera: intention, internal_monologue, public_message
```

## 🎮 Funkcjonalności

### Panel Sterowania (Control Panel)

**Suwaki Globalne:**
- **Entropia** (0.1x - 3.0x) - Prędkość zużycia energii (metabolizm)
- **Obfitość** (0.1x - 3.0x) - Częstotliwość spawnowania pokarmu

**Dodawanie BioBitów:**
- Przyciski dla każdej osobowości (Paranoik, Altruista, Manipulator, Neutralny)
- Szybkie dodawanie z domyślną osobowością

**Narzędzia Interakcji:**
- **Select** - Kliknij by zaznaczyć i inspekcjonować BioBita
- **Food** - Kliknij by zrespawnować jedzenie w wybranym miejscu
- **Lightning** - Uderz piorunem w obszar (zadaje 50 obrażeń)

**Wydarzenia Globalne:**
- **Zlodowacenie** - Spowolnienie metabolizmu na 5 sekund
- **Szał** - Wszystkie BioBity atakują przez 5 sekund

**Statystyki:**
- Liczba żywych/umarłych BioBitów
- Całkowita liczba śmierci, karmień i interakcji

### Inspektor Bytu (Inspector)

Po kliknięciu na BioBita wyświetla szczegółowy panel:

**Sekcje:**
- **Status** - Energia, osobowość, intencja, czas życia
- **Monolog Wewnętrzny** - Pełne uzasadnienie ostatniej decyzji
- **Mapa Relacji** - Lista znanych BioBitów z etykietami (przyjaciel/wróg/ofiara)
- **Historia Wiadomości** - Publiczne komunikaty vs prawdziwe intencje (wykrywanie kłamstw)
- **Pamięć Epizodyczna** - Ostatnie 5 zdarzeń z życia BioBita
- **Last Words** - Ostatnie słowa przed śmiercią (unikalne dla osobowości)

### Wizualizacja (The Abyss)

**Canvas z efektami:**
- Metaballs - Organiczne, rozmyte kształty BioBitów
- Glow effects - Efekt świecenia zależny od energii
- Pulsowanie - Nutrienty pulsują rytmicznie
- Trails - Ślady ruchu BioBitów
- Death animation - Zwłoki zanikają po 15 sekundach

**System Kolorów:**
- BioBity zmieniają kolor w zależności od intencji
- Intensywność świecenia zależy od poziomu energii
- Czerwony alert przy głodzeniu (<20% energii)

### Log Społeczny (Social Log)

Scrollująca lista ostatnich interakcji:
- Ataki (z ilością skradzionej energii)
- Dzielenie się energią
- Ucieczki przed zagrożeniem
- Zawieranie przyjaźni
- Zdrady

### Strumień Myśli (Thought Stream)

Widok globalny pokazujący:
- Chmurki myśli nad BioBitami
- Aktualne monologi wewnętrzne
- Publiczne wiadomości
- Wizualne oznaczenie kłamstw (gdy intencja != komunikat)

## 🔄 Mechanika Gry

### Energetyka

**Zużycie Energii:**
- Podstawowe: 0.008 * entropia * deltaTime
- Myślenie (LLM): 2 punkty
- Ruch: proporcjonalny do prędkości

**Źródła Energii:**
- Nutrienty: +15 do +50 (zależnie od typu)
- Atak: Kradzież 80% energii ofiary
- Dzielenie się: Przekazanie energii przyjaciołom

### Interakcje Społeczne

**Atak:**
- Możliwy gdy odległość < 40px
- Zadaje 10-25 obrażeń
- Skradziona energia: obrażenia * 0.8
- Ofiara oznacza napastnika jako "enemy"

**Dzielenie się:**
- Możliwe gdy energia > 30
- Przekazuje 5-15 energii
- Oba BioBity oznaczają się jako "friend"

**Ucieczka:**
- Prędkość x2 w przeciwnym kierunku
- Zużycie energii jak przy normalnym ruchu

### Śmierć i Respawn

**Warunki śmierci:**
- Energia spada do 0 (głód)
- Piorun (instant kill)
- Atak przez inny BioBit

**Po śmierci:**
- Wyświetlane "ostatnie słowa" (unikalne dla osobowości)
- Zwłoki pozostają na 15 sekund
- Usunięcie z puli żywych BioBitów

## 🚀 Uruchomienie

### Wymagania
- Node.js 18+
- Przeglądarka z obsługą WebGPU (Chrome, Edge)
- ~500MB RAM dla modelu LLM

### Instalacja

```bash
# Instalacja zależności
npm install

# Uruchomienie serwera deweloperskiego
ng serve

# Aplikacja dostępna pod http://localhost:4200
```

### Pierwsze Uruchomienie

1. Otwórz aplikację w przeglądarce
2. Poczekaj na załadowanie modelu WebLLM (pierwsze uruchomienie może potrwać)
3. Dodaj pierwszego BioBita używając panelu sterowania
4. Obserwuj jak zaczyna myśleć i podejmować decyzje!

## 🛠️ Rozwój

### Generowanie Kodu

```bash
# Nowy komponent
ng generate component nazwa-komponentu

# Nowy serwis
ng generate service services/nazwa-serwisu

# Nowy model
ng generate class models/nazwa-modelu
```

### Budowanie Produkcji

```bash
ng build --configuration production
```

Wynik w katalogu `dist/`.

### Testy

```bash
# Unit tests (Vitest)
ng test

# E2E tests
ng e2e
```

## 🚀 Deployment na GitHub Pages

### Automatyczny Deployment

Projekt jest skonfigurowany do automatycznego deploymentu na GitHub Pages przy każdym push do głównej gałęzi.

**Konfiguracja w repozytorium GitHub:**

1. Przejdź do **Settings** → **Pages**
2. W sekcji **Source** wybierz **GitHub Actions**
3. Przy następnym push, aplikacja zostanie automatycznie zbudowana i wdrożona

### Ręczny Deployment

```bash
# Zbuduj projekt dla GitHub Pages
npm run build:gh

# Wynik będzie w katalogu dist/biobit-ai/
```

**Uwaga:** Aplikacja wymaga WebGPU, więc działa tylko w:
- Chrome 113+
- Edge 113+
- Inne przeglądarki z WebGPU

Pierwsza wizyta wymaga pobrania modelu AI (~580 MB).

## 📝 Licencja

Projekt stworzony w celach edukacyjnych i demonstracyjnych.

## 🙏 Podziękowania

- [MLC AI](https://mlc.ai/) - WebLLM framework
- [Angular Team](https://angular.io/) - Framework
- [Tailwind CSS](https://tailwindcss.com/) - Styling

---

**BioBit AI** - Obserwuj jak sztuczna inteligencja ewoluuje w cyfrowym terrarium.
