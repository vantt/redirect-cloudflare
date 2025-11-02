
import { AnalyticsProvider } from '../provider';
import { AnalyticsEvent } from '../types';

export class ExampleMixpanelProvider implements AnalyticsProvider {
  readonly name = 'mixpanel';

  constructor(private token: string) {}

  send(event: AnalyticsEvent): Promise<void> {
    console.log('Sending event to Mixpanel', {
      token: this.token,
      event,
    });
    return Promise.resolve();
  }
}
