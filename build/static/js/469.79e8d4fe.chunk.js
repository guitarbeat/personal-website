"use strict";
(self.webpackChunkportfolio = self.webpackChunkportfolio || []).push([
	[469],
	{
		6469: (r, o, e) => {
			e.r(o), e.d(o, { default: () => s });
			var t = e(5043),
				n = e(579);
			class i extends t.Component {
				constructor(r) {
					super(r),
						(this.state = { hasError: !1, error: null, errorInfo: null });
				}
				static getDerivedStateFromError(r) {
					return { hasError: !0, error: r };
				}
				componentDidCatch(r, o) {
					this.setState({ error: r, errorInfo: o }),
						console.error("ErrorBoundary caught an error:", r, o);
				}
				render() {
					return this.state.hasError
						? (0, n.jsxs)("div", {
								style: {
									display: "flex",
									flexDirection: "column",
									justifyContent: "center",
									alignItems: "center",
									height: "100vh",
									width: "100vw",
									position: "fixed",
									top: 0,
									left: 0,
									padding: "20px",
									backgroundColor: "rgba(0,0,0,0.9)",
									color: "white",
								},
								children: [
									(0, n.jsx)("h1", { children: "Something went wrong" }),
									!1,
									(0, n.jsx)("button", {
										type: "button",
										onClick: () => window.location.reload(),
										style: {
											padding: "10px 20px",
											marginTop: "20px",
											backgroundColor: "white",
											color: "black",
											border: "none",
											borderRadius: "4px",
											cursor: "pointer",
										},
										children: "Reload Page",
									}),
								],
							})
						: this.props.children;
				}
			}
			const s = i;
		},
	},
]);
//# sourceMappingURL=469.79e8d4fe.chunk.js.map
