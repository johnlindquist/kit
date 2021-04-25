let response = await get(`https://scriptkit.com/api/showandtell`);
let url = await arg(`Pick a post to view:`, response.data);
exec(`open ${url}`);
export {};
