import axios from "axios"

export let get = (global.get = axios.get)
export let put = (global.put = axios.put)
export let post = (global.post = axios.post)
export let patch = (global.patch = axios.patch)
export let del = (global.delete = axios.delete)
