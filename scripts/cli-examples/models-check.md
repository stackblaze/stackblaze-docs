Check a model before you deploy it: the GPU it needs and the price of one copy:

```sh
stackblaze models check Qwen/Qwen3-8B
```

```text
OK Qwen/Qwen3-8B can be deployed
runs on  24 GB GPU per copy
price    from $0.25 up to $0.52 per hour, per copy
gated    no
```

A gated model needs its licence accepted on Hugging Face first. `--region` prices it for one region:

```sh
stackblaze models check meta-llama/Llama-3.1-8B-Instruct --region eu
```

```text
OK meta-llama/Llama-3.1-8B-Instruct can be deployed
runs on  24 GB GPU per copy
needs    about 23 GB of GPU memory
download 16.1 GB
price    from $0.25 up to $0.52 per hour, per copy
gated    yes
meta-llama/Llama-3.1-8B-Instruct is gated: accept its licence on Hugging Face, then sign in with that account.
```
