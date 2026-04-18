import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { useState } from "react";
import {
  AppProvider as PolarisAppProvider,
  Button,
  Card,
  FormLayout,
  Page,
  Text,
  TextField,
} from "@shopify/polaris";
import polarisItalian from "@shopify/polaris/locales/it.json";
import type { LoginError } from "@shopify/shopify-app-remix/server";
import { LoginErrorType } from "@shopify/shopify-app-remix/server";
import { login } from "../shopify.server";

function loginErrorMessage(loginErrors: LoginError): { shop?: string } {
  if (loginErrors?.shop === LoginErrorType.MissingShop) {
    return { shop: "Inserisci il dominio del negozio (es. mio-store.myshopify.com)." };
  }
  if (loginErrors?.shop === LoginErrorType.InvalidShop) {
    return { shop: "Dominio negozio non valido." };
  }
  return {};
}

export async function loader({ request }: LoaderFunctionArgs) {
  const errors = loginErrorMessage(await login(request));
  return { errors };
}

export async function action({ request }: ActionFunctionArgs) {
  const errors = loginErrorMessage(await login(request));
  return { errors };
}

export default function AuthLogin() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [shop, setShop] = useState("");
  const { errors } = actionData ?? loaderData;

  return (
    <PolarisAppProvider i18n={polarisItalian}>
      <Page>
        <Card>
          <Form method="post">
            <FormLayout>
              <Text variant="headingMd" as="h2">
                Accedi a EcoPass
              </Text>
              <TextField
                type="text"
                name="shop"
                label="Dominio negozio"
                helpText="es. mio-store.myshopify.com"
                value={shop}
                onChange={setShop}
                autoComplete="on"
                error={errors.shop}
              />
              <Button submit variant="primary">
                Continua
              </Button>
            </FormLayout>
          </Form>
        </Card>
      </Page>
    </PolarisAppProvider>
  );
}
