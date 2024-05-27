export const formatDate = (date: Date | undefined) => {
    if (!date) return "";
    // format as 2021-01-01
    return date.toISOString().split("T")[0];
};
