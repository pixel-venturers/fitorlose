import { cn } from "@/lib/utils";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

/** Single-open, animated FAQ. */
export function Faq({ items, className }) {
  return (
    <Accordion
      type="single"
      collapsible
      className={cn(
        "bg-card ring-foreground/10 overflow-hidden rounded-xl px-5 ring-1",
        className
      )}
    >
      {items.map((item) => (
        <AccordionItem key={item.q} value={item.q}>
          <AccordionTrigger className="text-left text-sm font-medium hover:no-underline">
            {item.q}
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground text-sm text-pretty">
            {item.a}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
