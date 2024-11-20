export const getDefaultConfig = () => ({
    title: "Octopus Energy Rates",
    entities: {
        current: "",
        past: "",
        future: "",
    },
    display: {
        cols: 1,
        showpast: false,
        showday: true,
        hour12: true,
        roundUnits: 2,
        unitstr: "",
        multiplier: 100,
    },
    colorThresholds: [
        { value: 0, color: "#391CD9" },
        { value: 15, color: "#4CAF50" },
        { value: 25, color: "#FFA500" },
        { value: 35, color: "#FF6347" },
    ],
    targetTimes: [],
});