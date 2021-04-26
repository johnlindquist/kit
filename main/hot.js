let choices = (await get("https://scriptkit.com/data/showandtell.json").catch(error => ({
    data: [
        {
            name: "😢 Failed to load top scripts",
            description: error.message,
        },
    ],
}))).data;
let url = await arg("Browse community scripts", choices);
exec(`open ${url}`);
export {};
