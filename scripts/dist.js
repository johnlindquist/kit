let distPath = process.env.DIST_PATH || home(".kit")
cp("bin", distPath)
