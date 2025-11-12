# Deploying template-supa

## Docker
Build and push the service images independently:
```bash
# API
docker build -f Dockerfile.api -t ghcr.io/YOUR-ORG/template-supa-api:latest .
# Auth
docker build -f Dockerfile.auth -t ghcr.io/YOUR-ORG/template-supa-auth:latest .

# Push to your registry once satisfied
docker push ghcr.io/YOUR-ORG/template-supa-api:latest
docker push ghcr.io/YOUR-ORG/template-supa-auth:latest
```

Both Dockerfiles compile the respective NestJS app with Nx/webpack, run `prisma generate`, install production dependencies and copy the Prisma engines needed at runtime. Provide the environment variables at runtime (see `.env.example`).

## Kubernetes
1. Edit `deploy/k8s/secret-example.yaml` with the credentials from o seu projeto Supabase e aplique como um `Secret` real (ex.: `kubectl apply -f deploy/k8s/secret-example.yaml`).
2. Ajuste `deploy/k8s/configmap.yaml` caso queira mudar portas ou o canal default do Realtime.
3. Atualize o campo `image` em `deploy/k8s/api.yaml`, `deploy/k8s/auth.yaml` e `deploy/k8s/prisma-migrate-job.yaml` com as referências que você publicou.
4. Suba os recursos:
   ```bash
   kubectl apply -f deploy/k8s/configmap.yaml
   kubectl apply -f deploy/k8s/secret-example.yaml   # ou o Secret definitivo
   kubectl apply -f deploy/k8s/api.yaml
   kubectl apply -f deploy/k8s/auth.yaml
   ```
5. Sempre que mudar o schema Prisma, rode o job:
   ```bash
   kubectl delete job/template-supa-prisma-migrate --ignore-not-found
   kubectl apply -f deploy/k8s/prisma-migrate-job.yaml
   ```

Exponha os serviços via Ingress/LoadBalancer conforme a topologia do cluster. Use `kubectl logs` para acompanhar os pods (`template-supa-api` e `template-supa-auth`).
