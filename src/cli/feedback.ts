let formData = JSON.parse(await arg())

await post(`https://scriptkit.com/api/feedback`, formData)

if (formData?.email && formData?.subscribe) {
  await post(`https://scriptkit.com/api/subscribe`, {
    email_address: formData?.email,
  })
}

export {}
