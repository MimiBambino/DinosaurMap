var View = {

    bluishMapStyle: [
        {
            stylers: [
                //{ hue: "#00ff99" },
                //{ hue: "#00ad0e" },
                { hue: "#00940c" },
                { saturation: -5 },
                { lightness: -40 }
            ]
        },
        {
            featureType: "all",
            elementType: "labels.icon",
            stylers: [
                {
                    "visibility": "off"
                }
            ]
        },
        {
            featureType: "administrative",
            elementType: "all",
            stylers: [
                {
                    "visibility": "simplified"
                }
            ]
        },
        {
            featureType: "administrative.country",
            elementType: "labels.text",
            stylers: [
                {
                    "visibility": "simplified"
                }
            ]
        },
        {
            featureType: "administrative",
            elementType: "labels.icon",
            stylers: [
                {
                    "visibility": "off"
                }
            ]
        },
        {
            featureType: "administrative.country",
            elementType: "geometry.fill",
            stylers: [
                {
                    "color": "#ff0000"
                },
                {
                    "visibility": "on"
                }
            ]
        },
        {
            featureType: "road",
            elementType: "geometry",
            stylers: [
                { visibility: "off" }
            ]
        },
        {
            featureType: "water",
            elementType: "geometry",
            stylers: [
                { hue: "#0000FF" },
                { saturation:-40}
            ]
        },
        {
            featureType: "administrative.neighborhood",
            elementType: "labels.text.stroke",
            stylers: [
                { visibility: "off" }
            ]
        },
        {
            featureType: "administrative.country",
            elementType: "labels.icon",
            stylers: [
                { "visibility": "off" }
            ]
        },
        {
            featureType: "road",
            elementType: "labels.text",
            stylers: [
                { visibility: "off" }
            ]
        },
        {
            featureType: "road.highway",
            elementType: "geometry.fill",
            stylers: [
                { visibility: "off" }
            ]
        }
    ]
}