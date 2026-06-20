import { useForm } from "react-hook-form";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  Input,
  Button,
} from "frontend";

export function AddServerForm() {
  const form = useForm({
    defaultValues: { address: "mc.hypixel.net", port: "25565" },
  });

  return (
    <div style={{ padding: 24, maxWidth: 420 }}>
      <Form {...form}>
        <form style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Server address</FormLabel>
                <FormControl>
                  <Input placeholder="mc.example.net" {...field} />
                </FormControl>
                <FormDescription>The public address players connect to.</FormDescription>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="port"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Port</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit">Add server</Button>
        </form>
      </Form>
    </div>
  );
}
