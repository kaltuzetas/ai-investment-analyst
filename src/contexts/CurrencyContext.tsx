import { createContext, useContext } from "react";
import { Currency, CURRENCY_SYMBOL } from "@/hooks/useCurrency";

interface CurrencyCtx {
  selected: Currency;
  convert: (amount: number, from?: string) => number;
  symbol: string;
}

export const CurrencyContext = createContext<CurrencyCtx>({
  selected: "USD",
  convert: (a) => a,
  symbol: CURRENCY_SYMBOL["USD"],
});

export const useCurrencyContext = () => useContext(CurrencyContext);
