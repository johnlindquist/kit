if (!test("-d", kenvPath("db"))) {
    mkdir("-p", kenvPath("db"));
}
db("kit", {
    shortcuts: { kit: { main: { index: "cmd ;" } } },
});
