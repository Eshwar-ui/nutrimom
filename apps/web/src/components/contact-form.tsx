"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "@/lib/toast-store";
import { Mail, Send, CheckCircle2, ArrowLeft } from "lucide-react";
import { Input, Textarea, Label } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Playful } from "@/components/ui/playful";
import { CustomSelect } from "@/components/ui/custom-select";

const contactSchema = z.object({
  name: z.string().min(2, "Please tell us your name"),
  email: z.string().email("Enter a valid email address"),
  topic: z.string().min(1, "Pick a topic"),
  message: z.string().min(10, "A little more detail helps us help you"),
});
type ContactInput = z.infer<typeof contactSchema>;

const topics = ["Order support", "Listing question", "Payment safety", "Selling on the marketplace", "Something else"];

export function ContactForm() {
  const [sent, setSent] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput>({ resolver: zodResolver(contactSchema), defaultValues: { topic: "" } });

  const onSubmit = async (data: ContactInput) => {
    // ponytail: front-end only — no /contact backend endpoint yet. Wire this
    // to a POST once the operator's inbox/support address is set (the page's
    // pre-launch banner tracks that). Until then we acknowledge locally.
    await new Promise((r) => setTimeout(r, 600));
    setSent(data.name.split(" ")[0]);
    toast.success("Thanks — your message is on its way!");
    reset();
  };

  if (sent) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center sm:p-10">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
          <CheckCircle2 className="h-8 w-8" strokeWidth={1.6} />
        </span>
        <h3 className="mt-5 font-display text-2xl font-semibold text-foreground">Thanks, {sent}!</h3>
        <p className="mt-2 max-w-sm leading-relaxed text-muted-foreground">
          Your message has been noted. We&apos;ll get back to you at the email you shared.
        </p>
        <button
          type="button"
          onClick={() => setSent(null)}
          className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-accent-text hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-7 sm:p-9" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="contact-name">Name</Label>
          <Input id="contact-name" autoComplete="name" placeholder="Your name" aria-invalid={!!errors.name} {...register("name")} />
          {errors.name && <p className="mt-1.5 text-xs text-danger">{errors.name.message}</p>}
        </div>
        <div>
          <Label htmlFor="contact-email">Email</Label>
          <Input id="contact-email" type="email" autoComplete="email" placeholder="you@email.com" aria-invalid={!!errors.email} {...register("email")} />
          {errors.email && <p className="mt-1.5 text-xs text-danger">{errors.email.message}</p>}
        </div>
      </div>

      <div className="mt-5">
        <Label htmlFor="contact-topic">Topic</Label>
        <Controller
          name="topic"
          control={control}
          render={({ field }) => (
            <CustomSelect
              id="contact-topic"
              options={topics}
              value={field.value}
              onChange={field.onChange}
              placeholder="Choose a topic…"
              invalid={!!errors.topic}
            />
          )}
        />
        {errors.topic && <p className="mt-1.5 text-xs text-danger">{errors.topic.message}</p>}
      </div>

      <div className="mt-5">
        <Label htmlFor="contact-message">Message</Label>
        <Textarea id="contact-message" rows={5} placeholder="How can we help?" aria-invalid={!!errors.message} {...register("message")} />
        {errors.message && <p className="mt-1.5 text-xs text-danger">{errors.message.message}</p>}
      </div>

      <div className="mt-6">
        <Playful>
          <Button type="submit" size="lg" disabled={isSubmitting}>
            {isSubmitting ? "Sending…" : <>Send message <Send className="h-4 w-4" /></>}
          </Button>
        </Playful>
      </div>
      <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Mail className="h-3.5 w-3.5" /> We&apos;ll only use your email to reply to this message.
      </p>
    </form>
  );
}
