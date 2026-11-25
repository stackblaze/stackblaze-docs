Buy $25 of prepaid GPU credit for AI models. The CLI prints the payment page (and opens it, when run from a terminal without `--no-browser`); nothing is charged until you pay there:

```sh
stackblaze billing gpu-credit add 25 --no-browser
```

```text
OK Pay for $25.00 of GPU credit here:
  https://checkout.stripe.com/g/pay/cs_test_…#…
The credit is added to your workspace once the payment completes (see `stackblaze billing gpu-credit`).
```

Amounts outside the allowed range are refused:

```sh
stackblaze billing gpu-credit add 5 --no-browser
```

```text
x  The smallest top-up is $10.00.
```
