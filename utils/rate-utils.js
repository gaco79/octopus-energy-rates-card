export const getRatesFromStateObj = (stateObj) => {
    if (stateObj.attributes?.rates?.length) {
        return stateObj.attributes.rates;
    }
    if (typeof stateObj.attributes?.rates === "object") {
        return Object.values(stateObj.attributes.rates);
    }
    return [];
};


export const getFilteredRates = (rates, showpast) => {
    const now = new Date();
    return rates
        .filter(rate => showpast || new Date(rate.start) > now)
        .sort((a, b) => new Date(a.start) - new Date(b.start));
};

export const getRateColor = (rate, colorThresholds) => {
    if (!colorThresholds?.length) return "#331100";

    const sortedThresholds = [...colorThresholds].sort((a, b) => a.value - b.value);
    const threshold = sortedThresholds.find(t => rate <= t.value);
    return threshold?.color || sortedThresholds[sortedThresholds.length - 1].color;
};

export const splitIntoColumns = (rates, config) => {
    const cols = config.display.cols || 1;
    const columns = Array.from({ length: cols }, () => []);
    rates.forEach((rate, index) => {
        columns[index % cols].push(rate);
    });
    return columns;
};