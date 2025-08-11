export interface Ambient {
  temperature: number;
  pressure: number;
  humidity: number;
}

export interface AmbientProvider {
  zipToAmbient(zip: string): Promise<Ambient>;
}

export const mockProvider: AmbientProvider = {
  async zipToAmbient(_zip: string) {
    return { temperature: 70, pressure: 14.7, humidity: 30 };
  }
};
