if (!test("-d", kenvPath("db"))) {
    mkdir("-p", kenvPath("db"));
}
await db("kit", {
    shortcuts: { kit: { main: { index: "cmd ;" } } },
});
export {};
