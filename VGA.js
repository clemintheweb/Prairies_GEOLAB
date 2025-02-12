// Déclare map et geoJsonLayer globalement
let map;
let geoJsonLayer;
let geoJsonData; // Stocke les données brutes pour les filtrer dynamiquement

document.addEventListener("DOMContentLoaded", function () {
    console.log("DOM chargé !");

    // ======================== INITIALISATION DE LA CARTE ========================

    var mapContainer = document.getElementById("fond_de_carte");
    if (!mapContainer) {
        console.error("Erreur : l'élément #fond_de_carte n'existe pas.");
        return;
    }

    if (typeof L === "undefined") {
        console.error("Erreur : Leaflet n'a pas été chargé correctement.");
        return;
    }

    // Création de la carte centrée sur Mittersheim
    map = L.map("fond_de_carte", { zoomControl: false }).setView([48.8833, 6.9333], 11);

    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution: "&copy; CARTO",
    }).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);

    // Charger les données GeoJSON
    loadGeoJSON();
});

// ======================== CHARGEMENT DU GEOJSON ========================
function loadGeoJSON() {
    fetch("parcelles_evo.geojson") //http://localhost:8000/parcelles_evo.geojson
        .then((response) => {
            if (!response.ok) throw new Error("Erreur réseau : Impossible de récupérer le fichier GeoJSON.");
            return response.json();
        })
        .then((data) => {
            console.log("GeoJSON chargé avec succès", data);
            geoJsonData = data; // Stocke les données brutes

            // Afficher la couche par défaut (2019)
            updateLayer("RM_201");
        })
        .catch((error) => console.error("Erreur lors du chargement du GeoJSON :", error));
}

// ======================== CHANGEMENT DE COUCHE SELON L'ANNÉE ========================
function updateYear() {
    let selectedYear = document.getElementById("year").value;
    let layerToShow;

    // Assign the layer name based on selected year
    if (selectedYear === "2019") {
        layerToShow = "RM_201"; // Layer corresponding to 2019
    } else if (selectedYear === "2022") {
        layerToShow = "RM_202"; // Layer corresponding to 2022
    } else {
        layerToShow = "Evolutn"; // Default layer for evolution
    }

    // Call updateLayer to update the displayed data based on the selected year
    updateLayer(layerToShow);
}

// ======================== FILTRAGE DES DONNÉES & AFFICHAGE ========================
// ======================== CHARGEMENT DU GEOJSON ========================
function loadGeoJSON() {
    fetch("parcelles_evo.geojson") //http://localhost:8000/parcelles_evo.geojson
        .then((response) => {
            if (!response.ok) throw new Error("Erreur réseau : Impossible de récupérer le fichier GeoJSON.");
            return response.json();
        })
        .then((data) => {
            console.log("GeoJSON chargé avec succès", data);
            geoJsonData = data; // Stocke les données brutes

            // Afficher la couche par défaut (2019)
            updateLayer("RM_201");
        })
        .catch((error) => console.error("Erreur lors du chargement du GeoJSON :", error));
}

// ======================== FILTRAGE DES DONNÉES & AFFICHAGE ========================
function updateLayer(layerName) {
    if (!geoJsonData) {
        console.error("Les données GeoJSON ne sont pas encore chargées !");
        return;
    }

    // Supprime la couche précédente
    if (geoJsonLayer) {
        map.removeLayer(geoJsonLayer);
    }

    // Définir un filtre en fonction du type de données
    let filterFunction;
    let styleFunction;

    if (layerName === "RM_201") {
        filterFunction = feature => feature.properties.RM___201 !== undefined;
        styleFunction = (feature) => {
            const classe2019 = feature.properties.RM___201;

            // Apply colors based on classes for 2019
            if (classe2019 === "Bon") {
                return { color: "#31a354", fillColor: "#31a354", fillOpacity: 0.9, weight: 2 };
            } else if (classe2019 === "Moyen") {
                return { color: "#addd8e", fillColor: "#addd8e", fillOpacity: 0.9, weight: 2 }; 
            } else if (classe2019 === "Faible") {
                return { color: "#f7fcb9", fillColor: "#f7fcb9", fillOpacity: 0.9, weight: 2 }; 
            }
        };
    } else if (layerName === "RM_202") {
        filterFunction = feature => feature.properties.RM___202 !== undefined;
        styleFunction = (feature) => {
            const classe2022 = feature.properties.RM___202;

            // Apply colors based on classes for 2022
            if (classe2022 === "Bon") {
                return { color: "#31a354", fillColor: "#31a354", fillOpacity: 0.9, weight: 2 }; // Green
            } else if (classe2022 === "Moyen") {
                return { color: "#addd8e", fillColor: "#addd8e", fillOpacity: 0.9, weight: 2 }; // Yellow
            } else if (classe2022 === "Faible") {
                return { color: "#f7fcb9", fillColor: "#f7fcb9", fillOpacity: 0.9, weight: 2 }; // Red
            }
        };
    } else {
        // Evolution layer
        filterFunction = feature => feature.properties.Evolutn !== undefined;
        styleFunction = (feature) => {
            let color;
            switch (feature.properties.Evolutn) {
                case "Evolution positive":
                    color = "#27a300"; // Vert
                    break;
                case "Evolution négative":
                    color = "#e34a33"; // Rouge
                    break;
                case "Stabilité":
                    color = "#c2c2c2"; // Jaune
                    break;
                default:
                    color = "#aaaaaa"; // Gris
            }
            return {
                color: color,
                fillColor: color,
                fillOpacity: 0.9,
                weight: 2
            };
        };
    }

    // Ajoute la nouvelle couche filtrée et stylisée
    geoJsonLayer = L.geoJSON(geoJsonData, {
        filter: filterFunction,
        style: styleFunction,
        onEachFeature: function (feature, layer) {
            let popupContent = `
                <b>Classe 2019 :</b> ${feature.properties.RM___201 ?? "Non disponible"}<br>
                <b>Classe 2022 :</b> ${feature.properties.RM___202 ?? "Non disponible"}<br>
                <b>Évolution :</b> ${feature.properties.Evolutn ?? "Non disponible"}
            `;
            layer.bindPopup(popupContent);

            // Effet de survol
            layer.on("mouseover", function () { this.setStyle({ color: "black", weight: 3 }); });
            layer.on("mouseout", function () { this.setStyle(styleFunction(feature)); });
        }
    }).addTo(map);
}

// ======================== GESTION DE L'AFFICHAGE DU BOUTON INFO ========================
document.addEventListener("DOMContentLoaded", function () {
    var infoButton = document.getElementById("InfoBouton");
    var infoElement = document.getElementById("Info");

    if (!infoButton || !infoElement) {
        console.error("Erreur : Bouton Info ou élément #Info introuvable.");
        return;
    }

    infoElement.style.display = "none"; // Masquer par défaut

    infoButton.addEventListener("click", function () {
        infoElement.style.display = (infoElement.style.display === "none") ? "block" : "none";
    });
});

// ======================== Légende ========================

// Create and add the legend to the map
function createLegend() {
    // Create the legend control
    var legend = L.control({ position: 'bottomright' });

    // Add the legend content
    legend.onAdd = function () {
        var div = L.DomUtil.create('div', 'info legend');

        // Classes for 2019/2022 and evolution
        var grades = ['Bon', 'Moyen', 'Faible']; // For 2019 and 2022
        var colors = ['#31a354', '#addd8e', '#f7fcb9']; // Colors for 2019/2022 classes
        var evolution = ['Évolution positive', 'Évolution négative', 'Stabilité']; // For Evolution
        var evolutionColors = ['#27a300', '#e34a33', '#c2c2c2']; // Colors for evolution

        // Add the classes for 2019 and 2022
        div.innerHTML += '<strong>Classe 2019 et 2022</strong><br>';
        for (var i = 0; i < grades.length; i++) {
            div.innerHTML +=
                '<i style="background:' + colors[i] + '"></i> ' +
                grades[i] + '<br>';
        }

        // Add a separator for evolution classes
        div.innerHTML += '<br><strong>Évolution 2019-2022</strong><br>';

        // Add the evolution classes
        for (var j = 0; j < evolution.length; j++) {
            div.innerHTML +=
                '<i style="background:' + evolutionColors[j] + '"></i> ' +
                evolution[j] + '<br>';
        }

        return div;
    };

    // Add the legend to the map
    legend.addTo(map);
}

// Call the function to create the legend after loading the GeoJSON data
document.addEventListener("DOMContentLoaded", function () {
    createLegend();
});


