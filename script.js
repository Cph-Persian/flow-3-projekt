/* EKSPANDERBAR MENU FUNKTIONALITET - Denne sektion håndterer al logik for dropdown menuen, inklusive åbning/lukning og animationer */

document.addEventListener('DOMContentLoaded', function() {
    // Venter på at DOM'en er fuldt indlæst før vi starter
    // Dette sikrer at alle elementer er tilgængelige for JavaScript
    
    // Find alle menu-items når siden er loaded
    const menuItems = document.querySelectorAll('.menu-item');
    
    // Tilføj click event listener til hvert menu item
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            // Find parent container for det klikkede menu item
            // Dette bruges til at styre åben/lukket tilstand
            const container = this.closest('.menu-item-container');
            
            // Toggle active class på containeren
            // Dette trigger CSS animationer og styling
            container.classList.toggle('active');
            
            // Luk alle andre åbne menuer (akkordion effekt)
            // Dette sikrer at kun én menu er åben ad gangen
            const siblings = document.querySelectorAll('.menu-item-container');
            siblings.forEach(sibling => {
                if (sibling !== container && sibling.classList.contains('active')) {
                    sibling.classList.remove('active');
                }
            });
        });
    });
});

/* EMAILJS KONTAKTFORMULAR */

document.addEventListener('DOMContentLoaded', function() {
    // Find kontaktformularen i DOM'en
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        // Tilføj submit event listener til formularen
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault(); // Forhindrer standard formular indsendelse
            
            // Opdater submit knappens tilstand
            const submitButton = contactForm.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.innerHTML;
            submitButton.innerHTML = 'Sender...';
            submitButton.disabled = true; // Deaktiver knappen mens vi sender

            // Indsaml alle formulardata til et objekt
            const templateParams = {
                from_name: contactForm.querySelector('#name').value,
                from_email: contactForm.querySelector('#email').value,
                subject: contactForm.querySelector('#subject').value,
                message: contactForm.querySelector('#message').value,
                to_name: 'Naturnat' // Fast modtager navn
            };

            // Debug information i konsollen
            console.log('Sender email med følgende parametre:', templateParams);

            // Send email via EmailJS service
            // service_5fvsv6q = Service ID fra EmailJS
            // template_fyb7xpa = Template ID fra EmailJS
            emailjs.send('service_5fvsv6q', 'template_fyb7xpa', templateParams)
                .then(function(response) {
                    // Håndter succesfuld afsendelse
                    console.log('SUCCESS!', response.status, response.text);
                    // Vis success besked og skjul eventuelle fejlbeskeder
                    document.getElementById('success-message').style.display = 'block';
                    document.getElementById('error-message').style.display = 'none';
                    contactForm.reset(); // Nulstil formularen
                })
                .catch(function(error) {
                    // Håndter fejl ved afsendelse
                    console.error('FAILED...', error);
                    // Vis fejlbesked til brugeren
                    const errorMessage = document.getElementById('error-message');
                    errorMessage.textContent = 'Der opstod en fejl: ' + (error.text || 'Ukendt fejl. Prøv venligst igen.');
                    errorMessage.style.display = 'block';
                    document.getElementById('success-message').style.display = 'none';
                })
                .finally(function() {
                    // Gendan knappens oprindelige tilstand
                    submitButton.innerHTML = originalButtonText;
                    submitButton.disabled = false;
                });
        });
    }
});

/* VEJR APP INTEGRATION -Henter og viser real-time vejrdata fra OpenWeather API, for forskellige lokationer i nationalparken */

// Definer koordinater og element IDs for hver lokation i parken
const locations = {
    mols: { lat: 56.2979888472158, lon: 10.4976696419618, element: 'mols-weather' },
    rold: { lat: 56.8391, lon: 9.8889, element: 'rold-weather' },
    thy: { lat: 56.9537, lon: 8.2548, element: 'thy-weather' }
};

/**
 * Henter vejrdata fra OpenWeather API
 * @param {number} lat - Breddegrad for lokationen
 * @param {number} lon - Længdegrad for lokationen
 * @returns {Promise<Object>} - Vejrdata for den specificerede lokation
 */
async function getWeather(lat, lon) {
    const apiKey = '496d913454e4dac0f9211f3aad419c93';
    // Byg API URL med parametre
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=da`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Fejl ved hentning af vejrdata:', error);
        return null;
    }
}

/**
 * Opdaterer et vejrkort med nye vejrdata
 * @param {string} elementId - ID på det HTML element der skal opdateres
 * @param {Object} weatherData - Vejrdata fra API'et
 */
function updateWeatherCard(elementId, weatherData) {
    if (!weatherData) return; // Sikkerhedscheck

    // Find vejrkortet i DOM'en
    const card = document.getElementById(elementId);
    if (!card) return;

    // Find alle nødvendige elementer i kortet
    const iconElement = card.querySelector('.weather-icon');
    const temperatureElement = card.querySelector('.temperature');
    const descriptionElement = card.querySelector('.description');
    const humidityElement = card.querySelector('.humidity');
    const windElement = card.querySelector('.wind');

    // Opdater vejr ikon med det korrekte ikon fra OpenWeather
    const iconCode = weatherData.weather[0].icon;
    iconElement.innerHTML = `<img src="https://openweathermap.org/img/wn/${iconCode}@2x.png" alt="Vejr ikon">`;

    // Opdater temperatur (afrundet til helt tal)
    const temperature = Math.round(weatherData.main.temp);
    temperatureElement.textContent = `${temperature}°C`;

    // Opdater vejrbeskrivelse (på dansk takket være lang=da i API kaldet)
    descriptionElement.textContent = weatherData.weather[0].description;

    // Opdater luftfugtighed og vindhastighed
    humidityElement.textContent = `Luftfugtighed: ${weatherData.main.humidity}%`;
    windElement.textContent = `Vind: ${Math.round(weatherData.wind.speed)} m/s`;
}

/**
 * Opdaterer vejrdata for alle definerede lokationer
 * Kaldes ved page load og derefter hvert 30. minut
 */
async function updateAllWeather() {
    // Loop gennem alle lokationer og opdater deres vejrdata
    for (const [location, data] of Object.entries(locations)) {
        const weatherData = await getWeather(data.lat, data.lon);
        updateWeatherCard(data.element, weatherData);
    }
}

// Start vejr opdateringer når siden indlæses
document.addEventListener('DOMContentLoaded', function() {
    updateAllWeather(); // Første opdatering ved page load
    // Opdater automatisk hver 30. minut (30 * 60 * 1000 ms)
    setInterval(updateAllWeather, 30 * 60 * 1000);
});

