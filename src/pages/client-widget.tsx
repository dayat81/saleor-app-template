import { useAppBridge } from "@saleor/app-sdk/app-bridge";
import { Text } from "@saleor/macaw-ui";
import { NextPage } from "next";

const ClientWidget: NextPage = () => {
  const { appBridgeState } = useAppBridge();

  if (!appBridgeState?.ready) {
    return <Text>Loading widget...</Text>;
  }

  return <Text>This is a client widget 😎. Your email is {appBridgeState.user?.email}.</Text>;
};

export default ClientWidget;
