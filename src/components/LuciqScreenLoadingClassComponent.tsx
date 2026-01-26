// import React from 'react';
// import { View, ViewProps } from 'react-native';
// import { ScreenLoadingManager } from '../modules/apm/ScreenLoadingManager';
//
// // Context to handle nested components
// const ScreenLoadingContext = React.createContext<boolean>(false);
//
// export interface LuciqScreenLoadingProps extends ViewProps {
//   screenName: string;
//   record?: boolean;
//   onMeasured?: (ttid: number) => void;
// }
//
// interface LuciqScreenLoadingState {
//   spanId: string | null;
//   isMeasured: boolean;
// }
//
// export class LuciqScreenLoading extends React.Component<
//   LuciqScreenLoadingProps,
//   LuciqScreenLoadingState
// > {
//   static contextType = ScreenLoadingContext;
//   declare context: React.ContextType<typeof ScreenLoadingContext>;
//
//   private constructorTimestamp: number;
//   private componentDidMountTimestamp?: number;
//   private renderStartTimestamp?: number;
//   private renderEndTimestamp?: number;
//
//   constructor(props: LuciqScreenLoadingProps) {
//     super(props);
//
//     this.constructorTimestamp = Date.now() * 1000; // microseconds
//
//     // Initialize span if conditions are met
//     let initialSpanId: string | null = null;
//     if (props.record !== false && ScreenLoadingManager.isFeatureEnabled()) {
//       const span = ScreenLoadingManager.createSpan(props.screenName, true);
//       if (span) {
//         initialSpanId = span.spanId;
//         ScreenLoadingManager.addSpanAttribute(span.spanId, 'component', 'LuciqScreenLoading');
//         console.log(`[LuciqScreenLoading] Span ${span.spanId} created in constructor`);
//       }
//     }
//
//     this.state = {
//       spanId: initialSpanId,
//       isMeasured: false,
//     };
//   }
//
//   componentDidMount() {
//     this.componentDidMountTimestamp = Date.now() * 1000;
//
//     // Check if we're nested and should ignore this component
//     if (this.context === true && this.state.spanId) {
//       console.log(
//         `[LuciqScreenLoading] Nested component detected, ignoring span ${this.state.spanId}`,
//       );
//       // Cancel the span
//       this.setState({ spanId: null });
//       return;
//     }
//
//     // Calculate and add lifecycle durations
//     if (this.state.spanId) {
//       const constructorDuration =
//         (this.componentDidMountTimestamp - this.constructorTimestamp) / 1000; // ms
//
//       ScreenLoadingManager.addSpanAttribute(this.state.spanId, 'lifecycle_durations', {
//         constructor_ms: constructorDuration,
//         componentDidMount_timestamp_us: this.componentDidMountTimestamp,
//       });
//
//       console.log(`[LuciqScreenLoading] Lifecycle measurements for span ${this.state.spanId}:`, {
//         constructor_ms: constructorDuration,
//       });
//     }
//   }
//
//   componentWillUnmount() {
//     // Cleanup on unmount if not measured
//     if (this.state.spanId && !this.state.isMeasured) {
//       ScreenLoadingManager.endSpan(this.state.spanId).catch((error) => {
//         console.warn('[LuciqScreenLoading] Failed to end span on unmount:', error);
//       });
//     }
//   }
//
//   handleLayout = async (event: any) => {
//     if (this.state.spanId && !this.state.isMeasured) {
//       this.setState({ isMeasured: true });
//
//       // Small delay to ensure frame is actually rendered
//       setTimeout(async () => {
//         if (this.state.spanId) {
//           // Add final render timestamp
//           const layoutTimestamp = Date.now() * 1000;
//           ScreenLoadingManager.addSpanAttribute(
//             this.state.spanId,
//             'layout_timestamp_us',
//             layoutTimestamp,
//           );
//
//           // Calculate render duration if we have the timestamps
//           if (this.renderStartTimestamp && this.renderEndTimestamp) {
//             const renderDuration = (this.renderEndTimestamp - this.renderStartTimestamp) / 1000; // ms
//
//             // Update lifecycle durations with render time
//             const span = ScreenLoadingManager.getActiveSpan(this.state.spanId);
//             if (span?.attributes.lifecycle_durations) {
//               span.attributes.lifecycle_durations.render_ms = renderDuration;
//             }
//           }
//
//           await ScreenLoadingManager.endSpan(this.state.spanId);
//
//           // Get the completed span to retrieve TTID
//           const span = ScreenLoadingManager.getActiveSpan(this.state.spanId);
//           if (span?.ttid && this.props.onMeasured) {
//             this.props.onMeasured(span.ttid / 1000); // Convert to milliseconds for callback
//           }
//         }
//       }, 0);
//     }
//
//     // Call original onLayout if provided
//     if (this.props.onLayout) {
//       this.props.onLayout(event);
//     }
//   };
//
//   render() {
//     // Track render start
//     this.renderStartTimestamp = Date.now() * 1000;
//
//     const result = (
//       <ScreenLoadingContext.Provider value={this.state.spanId !== null}>
//         <View {...this.props} onLayout={this.handleLayout}>
//           {this.props.children}
//         </View>
//       </ScreenLoadingContext.Provider>
//     );
//
//     // Track render end
//     this.renderEndTimestamp = Date.now() * 1000;
//
//     // Calculate render duration
//     if (this.state.spanId && this.renderStartTimestamp && this.renderEndTimestamp) {
//       const renderDuration = (this.renderEndTimestamp - this.renderStartTimestamp) / 1000; // ms
//
//       // Store render duration
//       ScreenLoadingManager.addSpanAttribute(this.state.spanId, 'lifecycle_durations', {
//         ...ScreenLoadingManager.getActiveSpan(this.state.spanId)?.attributes.lifecycle_durations,
//         render_ms: renderDuration,
//       });
//     }
//
//     return result;
//   }
// }
