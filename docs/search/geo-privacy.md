# Portal18 — Geolocation & Proximity Privacy Policy

> [!IMPORTANT]
> **OPT-IN ONLY | EPHEMERAL PROCESSING | COARSE DISTANCE DISPLAY | NO PRECISE GPS STORAGE**

---

## 1. Consentimento Explícito do Usuário

- A busca por proximidade ("Perto de mim") é disparada **exclusivamente mediante clique ativo** do usuário.
- O Portal18 nunca solicita permissão de geolocalização automaticamente ao carregar a página.

---

## 2. Processamento Efêmero & Não Persistência

1. **Uso Efêmero**:
   - As coordenadas de latitude e longitude obtidas do navegador são utilizadas apenas para determinar a cidade ou região metropolitana de origem.
   - O banco de dados **não armazena coordenadas GPS precisas do visitante**.
2. **Exibição de Distância Aproximada**:
   - Distâncias entre o usuário e os anunciantes são exibidas em faixas amplas (ex: *"Na sua cidade"*, *"Até 25 km"*, *"Até 50 km"*).
   - O endereço exato ou localização precisa do anunciante nunca é revelado.
3. **Cálculo Server-Side**:
   - A filtragem por raio de proximidade (`p_radius_km`) é validada no backend através da função `calculate_distance_km` para evitar manipulações no frontend.
