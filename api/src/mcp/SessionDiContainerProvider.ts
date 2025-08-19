import { RequestIdToken } from "../middleware/DependencyInjectionMiddlewareProvider";
import { DependencyContainer } from "tsyringe";

/** Create a session-level dependency injection container.
 * Useful for session-scoped dependencies.
 * Also useful for log tracing, via the requestId
 */
export default class SessionDiContainerProvider {
  constructor(protected container: DependencyContainer) {}

  create(sessionId: string) {
    const requestContainer = this.container.createChildContainer();
    requestContainer.register(RequestIdToken, { useValue: sessionId });

    return requestContainer;
  }
}
