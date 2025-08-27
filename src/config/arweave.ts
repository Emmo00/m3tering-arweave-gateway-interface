import { ARWEAVE_GATEWAY_URL, ARWEAVE_PEERS } from '../constants';

class ArweaveConfig {
  private gatewayUrl: string;

  constructor() {
    this.gatewayUrl = ARWEAVE_GATEWAY_URL ? ARWEAVE_GATEWAY_URL : ARWEAVE_PEERS[0];

    if (!this.gatewayUrl) {
      throw new Error('No Arweave gateway URL provided');
    }
  }

  public getGatewayUrl(): string {
    return this.gatewayUrl;
  }

  public rotateGatewayUrl() {
    // Rotate to the next gateway URL in the list
    const currentURL = this.gatewayUrl;
    const currentIndex = ARWEAVE_PEERS.indexOf(currentURL);
    if (currentIndex === -1 || currentIndex === ARWEAVE_PEERS.length - 1) {
      this.gatewayUrl = ARWEAVE_PEERS[0];
    } else {
      this.gatewayUrl = ARWEAVE_PEERS[currentIndex + 1];
    }

    // if new url is an ip, make sure it is a full url
    if (!this.gatewayUrl.startsWith('http://') && !this.gatewayUrl.startsWith('https://')) {
      this.gatewayUrl = `http://${this.gatewayUrl}`;
    }

    if (this.gatewayUrl === currentURL && ARWEAVE_PEERS.length > 1) {
      this.rotateGatewayUrl();
    }

    return this.gatewayUrl;
  }
}

export const arweaveConfig = new ArweaveConfig();
