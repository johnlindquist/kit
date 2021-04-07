while (true) {
    let script = await arg("npm?", [
        { name: "Install", value: "install" },
        { name: "Uninstall", value: "uninstall" },
        { name: "More Info", value: "more-info" },
    ]);
    await cli(script);
}
export {};
