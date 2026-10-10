import type { Request } from "express";
import type { AuthedRequest } from "../auth";

type SecurityEventType =
  | "login_success"
  | "login_failure"
  | "logout"
  | "password_reset_requested"
  | "password_reset_completed"
  | "email_verified"
  | "user_created"
  | "user_updated"
  | "user_role_changed"
  | "sale_created"
  | "sale_cancelled"
  | "sale_refunded"
  | "stock_adjusted"
  | "production_order_created"
  | "production_order_completed"
  | "purchase_order_created"
  | "purchase_order_received";

type SecuritySeverity = "low" | "medium" | "high" | "critical";

interface SecurityEvent {
  timestamp: string;
  eventType: SecurityEventType;
  severity: SecuritySeverity;
  userId?: string;
  userEmail?: string;
  organizationId?: string;
  storeId?: string;
  ip?: string;
  userAgent?: string;
  metadata: Record<string, any>;
}

class SecurityLogger {
  private static instance: SecurityLogger;

  private constructor() {}

  public static getInstance(): SecurityLogger {
    if (!SecurityLogger.instance) {
      SecurityLogger.instance = new SecurityLogger();
    }
    return SecurityLogger.instance;
  }

  private extractRequestInfo(req: Request | AuthedRequest) {
    const authedReq = req as AuthedRequest;
    return {
      userId: authedReq.user?.userId,
      userEmail: authedReq.user?.email,
      organizationId: authedReq.user?.organizationId ?? undefined,
      storeId: authedReq.user?.storeId ?? undefined,
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.get("User-Agent"),
    };
  }

  public log(
    eventType: SecurityEventType,
    severity: SecuritySeverity,
    metadata: Record<string, any> = {},
    req?: Request | AuthedRequest,
  ): void {
    const event: SecurityEvent = {
      timestamp: new Date().toISOString(),
      eventType,
      severity,
      metadata,
      ...(req ? this.extractRequestInfo(req) : {}),
    };

    // Dans un environnement de production, on enverrait vers un service de logging externe
    // Pour l'instant, on log en JSON structuré dans la console
    console.log(JSON.stringify(event));
  }

  public loginSuccess(req: AuthedRequest, userId: string, email: string): void {
    this.log("login_success", "low", { userId, email }, req);
  }

  public loginFailure(req: Request, email: string, reason: string): void {
    this.log("login_failure", "medium", { email, reason }, req);
  }

  public logout(req: AuthedRequest): void {
    this.log("logout", "low", {}, req);
  }

  public saleCancelled(req: AuthedRequest, saleId: string): void {
    this.log("sale_cancelled", "medium", { saleId }, req);
  }

  public saleCreated(req: AuthedRequest, saleId: string): void {
    this.log("sale_created", "low", { saleId }, req);
  }

  public userCreated(
    req: AuthedRequest,
    newUserId: string,
    newUserEmail: string,
  ): void {
    this.log("user_created", "medium", { newUserId, newUserEmail }, req);
  }

  public userUpdated(
    req: AuthedRequest,
    updatedUserId: string,
    changes: Record<string, any>,
  ): void {
    this.log("user_updated", "medium", { updatedUserId, changes }, req);
  }

  public userRoleChanged(
    req: AuthedRequest,
    affectedUserId: string,
    oldRole: string,
    newRole: string,
  ): void {
    this.log(
      "user_role_changed",
      "high",
      { affectedUserId, oldRole, newRole },
      req,
    );
  }

  public stockAdjusted(
    req: AuthedRequest,
    itemId: string,
    changes: Record<string, any>,
  ): void {
    this.log("stock_adjusted", "medium", { itemId, ...changes }, req);
  }

  public productionOrderCreated(
    req: AuthedRequest,
    orderId: string,
    changes: Record<string, any>,
  ): void {
    this.log("production_order_created", "low", { orderId, ...changes }, req);
  }

  public productionOrderCompleted(
    req: AuthedRequest,
    orderId: string,
    changes: Record<string, any>,
  ): void {
    this.log("production_order_completed", "low", { orderId, ...changes }, req);
  }

  public purchaseOrderCreated(
    req: AuthedRequest,
    orderId: string,
    changes: Record<string, any>,
  ): void {
    this.log("purchase_order_created", "low", { orderId, ...changes }, req);
  }

  public purchaseOrderReceived(
    req: AuthedRequest,
    orderId: string,
    changes: Record<string, any>,
  ): void {
    this.log("purchase_order_received", "medium", { orderId, ...changes }, req);
  }
}

export const securityLogger = SecurityLogger.getInstance();
