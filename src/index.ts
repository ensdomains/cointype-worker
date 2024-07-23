import { extractChain } from "viem"
import * as chains from "viem/chains"
import { Env } from "./types"
import { coinTypeToEvmChainId } from "@ensdomains/address-encoder/utils"
import { coinNameToTypeMap } from "@ensdomains/address-encoder"

type Params = Parameters<typeof Response.json>

export const corsify = (...params: Params) => {
  const [data, init = {}] = params
  const headers = init.headers ?? {}
  return Response.json(data, {
    ...init,
    headers: { ...headers, "Access-Control-Allow-Origin": "*" },
  })
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    try {
      const path = new URL(request.url).pathname

      const coinNameOrType: unknown = path.trim().replace("/", "").toLowerCase()

      const coinType =
        coinNameToTypeMap[coinNameOrType as keyof typeof coinNameToTypeMap] ||
        parseInt(coinNameOrType as string)
      if (isNaN(coinType))
        return corsify(
          {
            error: "Invalid coin type",
            message: `The coin type or coin name ${coinNameOrType} could not be found`,
          },
          { status: 400 },
        )

      // Ethereum mainnet is 60, but we need to convert it to 1
      const coinId = coinType === 60 ? 1 : coinTypeToEvmChainId(coinType)

      const coin = extractChain({
        chains: Object.values(chains),
        id: coinId,
      })

      if (!coin)
        return corsify(
          {
            error: "Chain not found",
            message: `The chain ${coinNameOrType} with ID ${coinId} could not be found`,
          },
          { status: 400 },
        )

      return corsify(coin)
    } catch (e) {
      const name = e instanceof Error ? e.name : "Error"
      const message = e instanceof Error ? e.message : "An error occurred"
      return corsify({ error: name, message }, { status: 500 })
    }
  },
} satisfies ExportedHandler<Env>
