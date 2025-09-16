# Sagutid Plugin Tests

Deze folder bevat test scripts en debug tools voor de Sagutid Plugin.

## 📁 Bestandsoverzicht

### `parameter_debug.php`
**Doel:** Debug script voor parameter opslag problemen in Joomla admin  
**Gebruik:** Bezoek via browser om plugin status en parameters te controleren  
**URL:** `http://sagutid.nl/plugins/system/sagutidloader/tests/parameter_debug.php`

**Functies:**
- Controleert of plugin actief is
- Toont huidige opgeslagen parameters
- Controleert debug bestanden in `/tmp/`
- Valideert plugin bestandsstructuur
- Test parameter extraction functionaliteit

### `parameter_helper_test.php`
**Doel:** Unit test voor ParameterHelper klasse  
**Gebruik:** Standalone test zonder volledige Joomla framework  
**URL:** `http://sagutid.nl/plugins/system/sagutidloader/tests/parameter_helper_test.php`

**Test Scenarios:**
- `getBoolParam()` functionaliteit
- `getStringParam()` functionaliteit  
- `getAssetParams()` extraction
- `normalizePostedParams()` data processing

## 🚀 Hoe te gebruiken

### Stap 1: Parameter Debug
1. Ga naar de Joomla admin plugin instellingen
2. Verander enkele parameter waarden
3. Sla op
4. Bezoek `parameter_debug.php` om te controleren of parameters correct zijn opgeslagen

### Stap 2: Unit Testing
1. Bezoek `parameter_helper_test.php` om de ParameterHelper functionaliteit te testen
2. Controleer of alle tests slagen (groene vinkjes)

### Stap 3: Unified Logging Test
1. Bezoek `unified_logging_test.php` om het complete logging systeem te testen
2. Test zowel PHP als TypeScript logging integratie
3. Controleer of logs correct weggeschreven worden naar unified log files

## 🔍 Debug Bestanden Locaties

De debug scripts maken bestanden aan in `/tmp/`:

- `sagutid_param_save_debug.json` - Parameter opslag proces details
- `sagutid_prepare_data_debug.json` - Form data voorbereiding details  
- `sagutid_save_error.log` - Opslag fouten
- `sagutid_prepare_error.log` - Voorbereiding fouten

## 🛠️ Troubleshooting

### Parameter worden niet opgeslagen
1. Run `parameter_debug.php`
2. Controleer debug bestanden in `/tmp/`
3. Kijk naar error logs voor specifieke foutmeldingen
4. Valideer dat plugin correct is geïnstalleerd

### Tests falen
1. Controleer of alle helper bestanden bestaan in `/src/`
2. Valideer namespace en class namen
3. Controleer PHP syntax fouten

## 📝 Nieuwe Tests Toevoegen

Om nieuwe tests toe te voegen:

1. Maak een nieuw PHP bestand in deze folder
2. Gebruik consistente naming: `[component]_test.php`
3. Voeg documentatie toe aan deze README
4. Gebruik HTML output voor browser-vriendelijke resultaten

## 🔧 Dependencies

- **parameter_debug.php**: Volledige Joomla framework nodig
- **parameter_helper_test.php**: Alleen ParameterHelper klasse nodig (standalone)

## ⚠️ Beveiliging

**LET OP:** Deze test bestanden bevatten geen authenticatie en kunnen gevoelige informatie tonen. Verwijder ze op productie servers of beveilig ze met `.htaccess`.

Voorbeeld `.htaccess` voor deze folder:
```apache
Order Deny,Allow
Deny from all
Allow from 127.0.0.1
Allow from ::1
```