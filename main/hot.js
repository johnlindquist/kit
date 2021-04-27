let url = await arg("Browse community scripts", async () => {
    let response = await get("https://scriptkit.com/data/showandtell.json");
    return response.data;
});
exec(`open ${url}`);
export {};
